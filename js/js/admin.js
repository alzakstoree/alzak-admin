// ==================== admin.js (معدل للإصدار 8) ====================
import { auth, db } from './firebase-config.js';
import { isAdmin as checkIsAdmin, ADMIN_EMAIL } from './auth.js'; // استيراد isAdmin من auth
import { loadStoreData, saveStoreData } from './store-data.js';
import { showToast } from './helpers.js';
import { confirmCharge } from './wallet.js';

let storeData = loadStoreData();

// دالة التحقق (يمكن استخدام isAdmin من auth)
export function isAdmin() {
    return auth.currentUser && auth.currentUser.email === ADMIN_EMAIL;
}

// دالة تحميل جميع بيانات لوحة التحكم (تستدعى عند فتح الصفحة)
export async function loadAdminDashboard() {
    if (!isAdmin()) {
        showToast('غير مصرح بالدخول', 'error');
        window.location.href = 'login.html';
        return;
    }
    await Promise.all([
        loadAdminProducts(),
        loadAdminOrders(),
        loadAdminCharges(),
        loadAdminUsers(),
        loadAdminStats()
    ]);
}

// (اختياري) يمكن ترك showAdminPanel إذا أردت استخدامها لعرض نافذة منبثقة، لكن في dashboard.html ستكون ظاهرة بشكل دائم.
window.showAdminPanel = function() {
    if (!isAdmin()) {
        showToast('غير مصرح لك بالدخول', 'error');
        return;
    }
    loadAdminDashboard();
};

// التبديل بين التبويبات
window.showAdminTab = function(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    
    if (tab === 'products') loadAdminProducts();
    if (tab === 'orders') loadAdminOrders();
    if (tab === 'charges') loadAdminCharges();
    if (tab === 'users') loadAdminUsers();
    if (tab === 'stats') loadAdminStats();
};

// ===== إدارة المنتجات (لا تعتمد على Firebase) =====
function loadAdminProducts() {
    let html = '<h3>📦 إدارة المنتجات</h3>';
    
    storeData.sections.forEach((section, s) => {
        section.categories.forEach((category, c) => {
            html += `<div style="margin-bottom: 20px;"><h4 style="color: #fbbf24;">${category.name}</h4>`;
            
            category.products.forEach((product, p) => {
                html += `
                    <div class="product-edit-card">
                        <div class="product-edit-row">
                            <input type="text" id="name_${s}_${c}_${p}" value="${product.name}">
                            <input type="number" id="price_${s}_${c}_${p}" value="${product.price}" step="0.01">
                        </div>
                        <div class="product-edit-actions">
                            <button class="save-btn" onclick="updateProduct(${s},${c},${p})">💾 حفظ</button>
                            <button class="delete-btn" onclick="deleteProduct(${s},${c},${p})">🗑️ حذف</button>
                        </div>
                    </div>
                `;
            });
            
            html += `
                <div style="margin-top: 10px;">
                    <input type="text" id="new_name_${s}_${c}" placeholder="اسم المنتج الجديد" style="width: 100%; background: #333; border: 1px solid #fbbf24; border-radius: 10px; padding: 12px; margin-bottom: 10px; color: #fff;">
                    <input type="number" id="new_price_${s}_${c}" placeholder="السعر" step="0.01" style="width: 100%; background: #333; border: 1px solid #fbbf24; border-radius: 10px; padding: 12px; margin-bottom: 10px; color: #fff;">
                    <button class="add-btn" onclick="addProduct(${s},${c})">➕ إضافة منتج</button>
                </div>
            `;
            html += `</div>`;
        });
    });
    
    document.getElementById('adminProducts').innerHTML = html;
}

window.updateProduct = function(s, c, p) {
    const name = document.getElementById(`name_${s}_${c}_${p}`).value;
    const price = parseFloat(document.getElementById(`price_${s}_${c}_${p}`).value);
    if (!name || isNaN(price)) return showToast('بيانات غير صحيحة', 'error');
    
    storeData.sections[s].categories[c].products[p].name = name;
    storeData.sections[s].categories[c].products[p].price = price;
    saveStoreData(storeData);
    showToast('✅ تم التعديل');
};

window.deleteProduct = function(s, c, p) {
    if (!confirm('حذف المنتج؟')) return;
    storeData.sections[s].categories[c].products.splice(p, 1);
    saveStoreData(storeData);
    loadAdminProducts();
    showToast('✅ تم الحذف');
};

window.addProduct = function(s, c) {
    const name = document.getElementById(`new_name_${s}_${c}`).value;
    const price = parseFloat(document.getElementById(`new_price_${s}_${c}`).value);
    if (!name || isNaN(price)) return showToast('بيانات غير صحيحة', 'error');
    
    storeData.sections[s].categories[c].products.push({ name, price });
    saveStoreData(storeData);
    document.getElementById(`new_name_${s}_${c}`).value = '';
    document.getElementById(`new_price_${s}_${c}`).value = '';
    loadAdminProducts();
    showToast('✅ تمت الإضافة');
};

// ===== إدارة الطلبات =====
async function loadAdminOrders() {
    if (!isAdmin()) return;
    
    try {
        const ordersRef = db.collection('orders').orderBy('createdAt', 'desc');
        const querySnapshot = await ordersRef.get();
        let html = '<h3>📋 جميع الطلبات</h3>';
        
        if (querySnapshot.empty) {
            html += '<p style="text-align: center;">لا توجد طلبات</p>';
        } else {
            querySnapshot.forEach(doc => {
                const o = doc.data();
                html += `
                    <div style="background: #1a1a1a; border-radius: 10px; padding: 15px; margin-bottom: 10px;">
                        <div><strong>${o.product}</strong> - ${o.price}$</div>
                        <div style="font-size: 12px;">المستخدم: ${o.userEmail}</div>
                        <div style="font-size: 12px;">معرف: ${o.playerId || 'غير محدد'}</div>
                        <div style="font-size: 10px; color: #666;">${new Date(o.createdAt).toLocaleString()}</div>
                        <select id="order_${doc.id}" style="width: 100%; margin: 10px 0; padding: 8px; background: #333; color: #fff; border: 1px solid #fbbf24; border-radius: 5px;">
                            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>⏳ قيد الانتظار</option>
                            <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>✅ مكتمل</option>
                        </select>
                        <button onclick="updateOrderStatus('${doc.id}')" style="width: 100%; background: #fbbf24; color: #000; border: none; padding: 8px; border-radius: 5px; font-weight: 700;">تحديث الحالة</button>
                    </div>
                `;
            });
        }
        
        document.getElementById('adminOrders').innerHTML = html;
    } catch (error) {
        console.error('خطأ في تحميل الطلبات:', error);
        showToast('فشل تحميل الطلبات', 'error');
    }
}

window.updateOrderStatus = async function(orderId) {
    const select = document.getElementById(`order_${orderId}`);
    if (!select) return;
    
    try {
        await db.collection('orders').doc(orderId).update({
            status: select.value
        });
        showToast('✅ تم التحديث');
        loadAdminOrders();
    } catch (error) {
        console.error(error);
        showToast('فشل التحديث', 'error');
    }
};

// ===== إدارة طلبات الشحن =====
async function loadAdminCharges() {
    if (!isAdmin()) return;
    
    try {
        const chargesRef = db.collection('charges').orderBy('date', 'desc');
        const querySnapshot = await chargesRef.get();
        let html = '<h3>💰 طلبات الشحن</h3>';
        
        if (querySnapshot.empty) {
            html += '<p style="text-align: center;">لا توجد طلبات شحن</p>';
        } else {
            querySnapshot.forEach(doc => {
                const c = doc.data();
                html += `
                    <div style="background: #1a1a1a; border-radius: 10px; padding: 15px; margin-bottom: 10px;">
                        <div><strong>${c.userEmail}</strong></div>
                        <div style="font-size: 18px; color: #fbbf24; font-weight: 900;">${c.amount}$</div>
                        <div style="font-size: 10px; color: #666;">${new Date(c.date).toLocaleString()}</div>
                        <div style="margin: 10px 0;">
                            <span style="background: ${c.status === 'pending' ? '#fbbf24' : '#22c55e'}; color: #000; padding: 5px 10px; border-radius: 20px;">${c.status === 'pending' ? '⏳ قيد الانتظار' : '✅ مكتمل'}</span>
                        </div>
                        ${c.status === 'pending' ? 
                            `<button onclick="confirmCharge('${doc.id}', '${c.userId}', ${c.amount})" style="width: 100%; background: #22c55e; color: #fff; border: none; padding: 10px; border-radius: 5px; font-weight: 700;">✅ تأكيد وصول المبلغ</button>` : 
                            ''}
                    </div>
                `;
            });
        }
        
        document.getElementById('adminCharges').innerHTML = html;
    } catch (error) {
        console.error('خطأ في تحميل طلبات الشحن:', error);
        showToast('فشل تحميل طلبات الشحن', 'error');
    }
}

// استخدام confirmCharge المستوردة من wallet.js
window.confirmCharge = async function(chargeId, userId, amount) {
    if (!isAdmin()) return;
    await confirmCharge(chargeId, userId, amount);
    loadAdminCharges(); // إعادة تحميل القائمة
};

// ===== إدارة العملاء =====
async function loadAdminUsers() {
    if (!isAdmin()) return;
    
    try {
        const usersSnap = await db.collection('users').get();
        let html = '<h3>👥 العملاء</h3><table style="width: 100%; border-collapse: collapse;">';
        html += '<tr><th>الاسم</th><th>البريد</th><th>الرصيد</th><th>تاريخ التسجيل</th></tr>';
        
        if (usersSnap.empty) {
            html += '<tr><td colspan="4" style="text-align: center;">لا يوجد عملاء</td></tr>';
        } else {
            usersSnap.forEach(doc => {
                const u = doc.data();
                html += `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #333;">${u.name}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #333;">${u.email}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #333; color: #fbbf24;">${u.walletBalance || 0}$</td>
                        <td style="padding: 8px; border-bottom: 1px solid #333; font-size: 10px;">${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                    </tr>
                `;
            });
        }
        
        html += '</table>';
        document.getElementById('adminUsers').innerHTML = html;
    } catch (error) {
        console.error('خطأ في تحميل العملاء:', error);
        showToast('فشل تحميل العملاء', 'error');
    }
}

// ===== الإحصائيات =====
async function loadAdminStats() {
    if (!isAdmin()) return;
    
    try {
        const usersSnap = await db.collection('users').get();
        const ordersSnap = await db.collection('orders').get();
        
        let totalOrders = 0, totalSales = 0, pendingOrders = 0;
        ordersSnap.forEach(doc => {
            const o = doc.data();
            totalOrders++;
            totalSales += o.price || 0;
            if (o.status === 'pending') pendingOrders++;
        });
        
        document.getElementById('adminStats').innerHTML = `
            <h3>📊 الإحصائيات</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                <div style="background: #1a1a1a; border-radius: 15px; padding: 20px; text-align: center;">
                    <div style="font-size: 32px; color: #fbbf24;">${usersSnap.size}</div>
                    <div>العملاء</div>
                </div>
                <div style="background: #1a1a1a; border-radius: 15px; padding: 20px; text-align: center;">
                    <div style="font-size: 32px; color: #fbbf24;">${totalOrders}</div>
                    <div>الطلبات</div>
                </div>
                <div style="background: #1a1a1a; border-radius: 15px; padding: 20px; text-align: center;">
                    <div style="font-size: 32px; color: #fbbf24;">${pendingOrders}</div>
                    <div>قيد الانتظار</div>
                </div>
                <div style="background: #1a1a1a; border-radius: 15px; padding: 20px; text-align: center;">
                    <div style="font-size: 32px; color: #fbbf24;">${totalSales}$</div>
                    <div>المبيعات</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
        showToast('فشل تحميل الإحصائيات', 'error');
    }
}

// ===== دوال إضافية للإحصائيات الرئيسية (بنفس الطريقة) =====
async function calculateTotalSales() {
    const ordersSnap = await db.collection('orders').get();
    let total = 0;
    ordersSnap.forEach(doc => {
        total += doc.data().price || 0;
    });
    return total;
}

async function calculateTotalCost() {
    // يمكن تعديلها حسب الحاجة
    return 0;
}

async function calculateNetProfit() {
    const totalSales = await calculateTotalSales();
    const totalCost = await calculateTotalCost();
    return totalSales - totalCost;
}

async function calculateTotalDebt() {
    const usersSnap = await db.collection('users').get();
    let totalDebt = 0;
    usersSnap.forEach(doc => {
        totalDebt += doc.data().debtBalance || 0;
    });
    return totalDebt;
}

async function calculateMonthlyOrders() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    
    const querySnapshot = await db.collection('orders')
        .where('createdAt', '>=', startOfMonth)
        .where('createdAt', '<=', endOfMonth)
        .get();
    return querySnapshot.size;
}

async function calculatePendingOrders() {
    const querySnapshot = await db.collection('orders').where('status', '==', 'pending').get();
    return querySnapshot.size;
}

function calculateActiveProducts() {
    const storeData = loadStoreData();
    let count = 0;
    storeData.sections.forEach(section => {
        section.categories.forEach(category => {
            count += category.products.length;
        });
    });
    return count;
}

async function calculateTotalUsers() {
    const usersSnap = await db.collection('users').get();
    return usersSnap.size;
}

async function calculateTotalUserBalance() {
    const usersSnap = await db.collection('users').get();
    let total = 0;
    usersSnap.forEach(doc => {
        total += doc.data().walletBalance || 0;
    });
    return total;
}

async function calculateProcessedCharges() {
    const querySnapshot = await db.collection('charges').where('status', '==', 'completed').get();
    return querySnapshot.size;
}

async function calculateAllowedDebtUsers() {
    const usersSnap = await db.collection('users').get();
    let count = 0;
    usersSnap.forEach(doc => {
        if (doc.data().allowedDebt) count++;
    });
    return count;
}

export async function updateDashboardCards() {
    document.getElementById('totalSales').textContent = (await calculateTotalSales()).toFixed(2) + '$';
    document.getElementById('totalCost').textContent = (await calculateTotalCost()).toFixed(2) + '$';
    document.getElementById('netProfit').textContent = (await calculateNetProfit()).toFixed(2) + '$';
    document.getElementById('totalDebt').textContent = (await calculateTotalDebt()).toFixed(2) + '$';
    document.getElementById('monthlyOrders').textContent = await calculateMonthlyOrders();
    document.getElementById('pendingOrders').textContent = await calculatePendingOrders();
    document.getElementById('activeProducts').textContent = calculateActiveProducts();
    document.getElementById('totalUsers').textContent = await calculateTotalUsers();
    document.getElementById('totalUserBalance').textContent = (await calculateTotalUserBalance()).toFixed(2) + '$';
    document.getElementById('processedCharges').textContent = await calculateProcessedCharges();
    document.getElementById('allowedDebtUsers').textContent = await calculateAllowedDebtUsers();
    document.getElementById('totalOrdersCount').textContent = (await db.collection('orders').get()).size;
    
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    document.getElementById('monthRange').textContent = 
        `${lastDay.toLocaleDateString()} – ${firstDay.toLocaleDateString()}`;
}

window.loadAdminDashboard = async function() {
    await updateDashboardCards();
    loadAdminProducts();
    loadAdminOrders();
    loadAdminCharges();
    loadAdminUsers();
    loadAdminStats();
};

// ===== ربط جميع الدوال بـ window =====
window.loadAdminProducts = loadAdminProducts;
window.loadAdminOrders = loadAdminOrders;
window.loadAdminCharges = loadAdminCharges;
window.loadAdminUsers = loadAdminUsers;
window.loadAdminStats = loadAdminStats;
window.loadAdminDashboard = loadAdminDashboard;
window.updateDashboardCards = updateDashboardCards;
window.calculateTotalSales = calculateTotalSales;
window.calculateTotalCost = calculateTotalCost;
window.calculateNetProfit = calculateNetProfit;
window.calculateTotalDebt = calculateTotalDebt;
window.calculateMonthlyOrders = calculateMonthlyOrders;
window.calculatePendingOrders = calculatePendingOrders;
window.calculateActiveProducts = calculateActiveProducts;
window.calculateTotalUsers = calculateTotalUsers;
window.calculateTotalUserBalance = calculateTotalUserBalance;
window.calculateProcessedCharges = calculateProcessedCharges;
window.calculateAllowedDebtUsers = calculateAllowedDebtUsers;

// ===== دوال مؤقتة للقائمة الجانبية (سيتم استبدالها بـ admin-extras.js) =====
window.showPaymentMethods = function() { showToast('🚧 طرق الدفع قيد التطوير', 'info'); };
window.showCurrencies = function() { showToast('🚧 العملات قيد التطوير', 'info'); };
window.showVipProfit = function() { showToast('🚧 نسبة ربح VIP قيد التطوير', 'info'); };
window.showProfitLog = function() { showToast('🚧 سجل الأرباح قيد التطوير', 'info'); };
window.showDebtBalance = function() { showToast('🚧 الرصيد المدين قيد التطوير', 'info'); };
window.showTopSpenders = function() { showToast('🚧 المستخدمون الأكثر صرفاً قيد التطوير', 'info'); };
window.showVipUsers = function() { showToast('🚧 إدارة الدولاء قيد التطوير', 'info'); };
window.showReferrals = function() { showToast('🚧 الإجالات قيد التطوير', 'info'); };
window.showDesign = function() { showToast('🚧 التصميم قيد التطوير', 'info'); };
window.showOrderMessages = function() { showToast('🚧 رسائل الطلب قيد التطوير', 'info'); };
window.showOrderManagement = function() { showToast('🚧 إدارة الترتيب قيد التطوير', 'info'); };
window.showContactMethods = function() { showToast('🚧 وسائل التواصل قيد التطوير', 'info'); };
window.showAdminAccounts = function() { showToast('🚧 حسابات الإدارة قيد التطوير', 'info'); };
window.showTwoFactor = function() { showToast('🚧 الحقوق بخطوتين قيد التطوير', 'info'); };