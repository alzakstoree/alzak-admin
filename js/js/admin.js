// ==================== admin.js (دمج كامل مع admin-extras.js) ====================
import { supabase } from './supabase-config.js';
import { loadStoreData, saveStoreData } from './store-data.js';
import { showToast, showModal, closeModal } from './helpers.js';
import { confirmCharge } from './wallet.js';

let storeData = loadStoreData();

// دالة التحقق من أن المستخدم الحالي هو المدير
export function isAdmin() {
    const user = supabase.auth.user();
    return user && user.email === 'alolao45y@gmail.com';
}

// دالة تحميل جميع بيانات لوحة التحكم
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
        loadAdminStats(),
        updateDashboardCards()
    ]);
}

window.showAdminPanel = function() {
    if (!isAdmin()) {
        showToast('غير مصرح لك بالدخول', 'error');
        return;
    }
    loadAdminDashboard();
};

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

// ===== إدارة المنتجات (لا تعتمد على قاعدة البيانات) =====
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
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .order('createdAt', { ascending: false });
        
        if (error) throw error;
        
        let html = '<h3>📋 جميع الطلبات</h3>';
        
        if (!orders || orders.length === 0) {
            html += '<p style="text-align: center;">لا توجد طلبات</p>';
        } else {
            orders.forEach(order => {
                html += `
                    <div style="background: #1a1a1a; border-radius: 10px; padding: 15px; margin-bottom: 10px;">
                        <div><strong>${order.product}</strong> - ${order.price}$</div>
                        <div style="font-size: 12px;">المستخدم: ${order.userEmail}</div>
                        <div style="font-size: 12px;">معرف: ${order.playerId || 'غير محدد'}</div>
                        <div style="font-size: 10px; color: #666;">${new Date(order.createdAt).toLocaleString()}</div>
                        <select id="order_${order.id}" style="width: 100%; margin: 10px 0; padding: 8px; background: #333; color: #fff; border: 1px solid #fbbf24; border-radius: 5px;">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ قيد الانتظار</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>✅ مكتمل</option>
                        </select>
                        <button onclick="updateOrderStatus('${order.id}')" style="width: 100%; background: #fbbf24; color: #000; border: none; padding: 8px; border-radius: 5px; font-weight: 700;">تحديث الحالة</button>
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
        const { error } = await supabase
            .from('orders')
            .update({ status: select.value })
            .eq('id', orderId);
        
        if (error) throw error;
        
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
        const { data: charges, error } = await supabase
            .from('charges')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        let html = '<h3>💰 طلبات الشحن</h3>';
        
        if (!charges || charges.length === 0) {
            html += '<p style="text-align: center;">لا توجد طلبات شحن</p>';
        } else {
            charges.forEach(charge => {
                html += `
                    <div style="background: #1a1a1a; border-radius: 10px; padding: 15px; margin-bottom: 10px;">
                        <div><strong>${charge.userEmail}</strong></div>
                        <div style="font-size: 18px; color: #fbbf24; font-weight: 900;">${charge.amount}$</div>
                        <div style="font-size: 10px; color: #666;">${new Date(charge.date).toLocaleString()}</div>
                        <div style="margin: 10px 0;">
                            <span style="background: ${charge.status === 'pending' ? '#fbbf24' : '#22c55e'}; color: #000; padding: 5px 10px; border-radius: 20px;">${charge.status === 'pending' ? '⏳ قيد الانتظار' : '✅ مكتمل'}</span>
                        </div>
                        ${charge.status === 'pending' ? 
                            `<button onclick="confirmCharge('${charge.id}', '${charge.userId}', ${charge.amount})" style="width: 100%; background: #22c55e; color: #fff; border: none; padding: 10px; border-radius: 5px; font-weight: 700;">✅ تأكيد وصول المبلغ</button>` : 
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

window.confirmCharge = async function(chargeId, userId, amount) {
    if (!isAdmin()) return;
    await confirmCharge(chargeId, userId, amount);
    loadAdminCharges();
};

// ===== إدارة العملاء =====
async function loadAdminUsers() {
    if (!isAdmin()) return;
    
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*');
        
        if (error) throw error;
        
        let html = '<h3>👥 العملاء</h3><table style="width: 100%; border-collapse: collapse;">';
        html += '<tr><th>الاسم</th><th>البريد</th><th>الرصيد</th><th>تاريخ التسجيل</th></tr>';
        
        if (!users || users.length === 0) {
            html += '<tr><td colspan="4" style="text-align: center;">لا يوجد عملاء</td></tr>';
        } else {
            users.forEach(user => {
                html += `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #333;">${user.name}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #333;">${user.email}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #333; color: #fbbf24;">${user.walletBalance || 0}$</td>
                        <td style="padding: 8px; border-bottom: 1px solid #333; font-size: 10px;">${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
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
        const { count: usersCount, error: usersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*');
        
        if (usersError || ordersError) throw usersError || ordersError;
        
        let totalOrders = 0, totalSales = 0, pendingOrders = 0;
        orders.forEach(order => {
            totalOrders++;
            totalSales += order.price || 0;
            if (order.status === 'pending') pendingOrders++;
        });
        
        document.getElementById('adminStats').innerHTML = `
            <h3>📊 الإحصائيات</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                <div style="background: #1a1a1a; border-radius: 15px; padding: 20px; text-align: center;">
                    <div style="font-size: 32px; color: #fbbf24;">${usersCount}</div>
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

// ===== دوال إضافية للإحصائيات الرئيسية =====
async function calculateTotalSales() {
    const { data: orders, error } = await supabase.from('orders').select('price');
    if (error) return 0;
    return orders.reduce((acc, o) => acc + (o.price || 0), 0);
}

async function calculateTotalCost() {
    // حسب الحاجة
    return 0;
}

async function calculateNetProfit() {
    const totalSales = await calculateTotalSales();
    const totalCost = await calculateTotalCost();
    return totalSales - totalCost;
}

async function calculateTotalDebt() {
    const { data: users, error } = await supabase.from('users').select('debtBalance');
    if (error) return 0;
    return users.reduce((acc, u) => acc + (u.debtBalance || 0), 0);
}

async function calculateMonthlyOrders() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    
    const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('createdAt', startOfMonth)
        .lte('createdAt', endOfMonth);
    
    if (error) return 0;
    return count;
}

async function calculatePendingOrders() {
    const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
    
    if (error) return 0;
    return count;
}

function calculateActiveProducts() {
    return storeData.sections.reduce((acc, s) => 
        acc + s.categories.reduce((acc2, c) => acc2 + c.products.length, 0), 0);
}

async function calculateTotalUsers() {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) return 0;
    return count;
}

async function calculateTotalUserBalance() {
    const { data: users, error } = await supabase.from('users').select('walletBalance');
    if (error) return 0;
    return users.reduce((acc, u) => acc + (u.walletBalance || 0), 0);
}

async function calculateProcessedCharges() {
    const { count, error } = await supabase
        .from('charges')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
    
    if (error) return 0;
    return count;
}

async function calculateAllowedDebtUsers() {
    const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('allowedDebt', true);
    
    if (error) return 0;
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
    
    const { count, error } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    document.getElementById('totalOrdersCount').textContent = error ? 0 : count;
    
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

// ========== دوال القائمة الجانبية (من admin-extras.js) ==========

// ==================== طرق الدفع ====================
async function loadPaymentMethods() {
    try {
        const { data: paymentMethods, error } = await supabase
            .from('paymentMethods')
            .select('*');
        
        if (error) throw error;
        
        let html = '<h3>💳 طرق الدفع</h3>';
        html += '<button class="add-btn" onclick="showAddPaymentMethodModal()">➕ إضافة طريقة دفع جديدة</button>';
        html += '<div class="payment-methods-grid">';
        
        if (!paymentMethods || paymentMethods.length === 0) {
            html += '<p style="text-align:center;">لا توجد طرق دفع مضافة بعد</p>';
        } else {
            paymentMethods.forEach(m => {
                html += `
                    <div class="payment-card" data-id="${m.id}">
                        <img src="${m.image || 'https://via.placeholder.com/80'}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid #fbbf24;">
                        <div style="color:#fbbf24; font-weight:700; margin:5px 0;">${m.name}</div>
                        <div style="color:#888; font-size:12px;">${m.accountNumber || ''}</div>
                        <div style="margin-top:10px;">
                            <button class="edit-btn" onclick="editPaymentMethod('${m.id}')">✏️</button>
                            <button class="delete-btn" onclick="deletePaymentMethod('${m.id}')">🗑️</button>
                        </div>
                    </div>
                `;
            });
        }
        html += '</div>';
        showModal('paymentMethodsModal', html);
    } catch (error) {
        console.error('خطأ في تحميل طرق الدفع:', error);
        showToast('فشل تحميل طرق الدفع', 'error');
    }
}

window.showAddPaymentMethodModal = function() {
    const form = `
        <h3>➕ إضافة طريقة دفع</h3>
        <input id="pmName" placeholder="الاسم">
        <input id="pmNumber" placeholder="رقم الحساب/المحفظة">
        <input id="pmImage" placeholder="رابط الصورة (اختياري)">
        <input id="pmAccountName" placeholder="اسم صاحب الحساب (اختياري)">
        <button onclick="savePaymentMethod()">حفظ</button>
    `;
    showModal('paymentMethodsModal', form);
};

window.savePaymentMethod = async function() {
    const name = document.getElementById('pmName')?.value;
    const number = document.getElementById('pmNumber')?.value;
    const image = document.getElementById('pmImage')?.value;
    const accountName = document.getElementById('pmAccountName')?.value;
    if (!name || !number) return showToast('الرجاء إدخال الاسم والرقم', 'error');
    
    try {
        const { error } = await supabase
            .from('paymentMethods')
            .insert([{
                name,
                accountNumber: number,
                image: image || '',
                accountName: accountName || '',
                createdAt: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        showToast('✅ تمت الإضافة');
        closeModal('paymentMethodsModal');
        loadPaymentMethods();
    } catch (error) {
        console.error(error);
        showToast('فشلت الإضافة', 'error');
    }
};

window.editPaymentMethod = async function(id) {
    const { data: m, error } = await supabase
        .from('paymentMethods')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error || !m) return showToast('غير موجود', 'error');
    
    const form = `
        <h3>✏️ تعديل طريقة الدفع</h3>
        <input id="pmNameEdit" value="${m.name}" placeholder="الاسم">
        <input id="pmNumberEdit" value="${m.accountNumber || ''}" placeholder="رقم الحساب">
        <input id="pmImageEdit" value="${m.image || ''}" placeholder="رابط الصورة">
        <input id="pmAccountNameEdit" value="${m.accountName || ''}" placeholder="اسم صاحب الحساب">
        <button onclick="updatePaymentMethod('${id}')">تحديث</button>
    `;
    showModal('paymentMethodsModal', form);
};

window.updatePaymentMethod = async function(id) {
    const name = document.getElementById('pmNameEdit')?.value;
    const number = document.getElementById('pmNumberEdit')?.value;
    const image = document.getElementById('pmImageEdit')?.value;
    const accountName = document.getElementById('pmAccountNameEdit')?.value;
    if (!name || !number) return showToast('الرجاء إدخال الاسم والرقم', 'error');
    
    try {
        const { error } = await supabase
            .from('paymentMethods')
            .update({ name, accountNumber: number, image, accountName })
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم التحديث');
        closeModal('paymentMethodsModal');
        loadPaymentMethods();
    } catch (error) {
        console.error(error);
        showToast('فشل التحديث', 'error');
    }
};

window.deletePaymentMethod = async function(id) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
        const { error } = await supabase
            .from('paymentMethods')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم الحذف');
        loadPaymentMethods();
    } catch (error) {
        console.error(error);
        showToast('فشل الحذف', 'error');
    }
};

// ==================== العملات ====================
async function loadCurrencies() {
    try {
        const { data: currencies, error } = await supabase
            .from('currencies')
            .select('*');
        
        if (error) throw error;
        
        let html = '<h3>💰 العملات</h3>';
        html += '<button class="add-btn" onclick="showAddCurrencyModal()">➕ إضافة عملة</button>';
        html += '<table><tr><th>الاسم</th><th>الرمز</th><th>سعر الصرف</th><th>إجراءات</th></tr>';
        if (!currencies || currencies.length === 0) {
            html += '<tr><td colspan="4" style="text-align:center;">لا توجد عملات</td></tr>';
        } else {
            currencies.forEach(c => {
                html += `
                    <tr>
                        <td>${c.name}</td>
                        <td>${c.symbol}</td>
                        <td>${c.exchangeRate || 1}</td>
                        <td>
                            <button class="edit-btn" onclick="editCurrency('${c.id}')">✏️</button>
                            <button class="delete-btn" onclick="deleteCurrency('${c.id}')">🗑️</button>
                        </td>
                    </tr>
                `;
            });
        }
        html += '</table>';
        showModal('currenciesModal', html);
    } catch (error) {
        console.error(error);
        showToast('فشل تحميل العملات', 'error');
    }
}

window.showAddCurrencyModal = function() {
    const form = `
        <h3>➕ إضافة عملة</h3>
        <input id="curName" placeholder="اسم العملة">
        <input id="curSymbol" placeholder="الرمز">
        <input id="curRate" placeholder="سعر الصرف" value="1">
        <button onclick="saveCurrency()">حفظ</button>
    `;
    showModal('currenciesModal', form);
};

window.saveCurrency = async function() {
    const name = document.getElementById('curName')?.value;
    const symbol = document.getElementById('curSymbol')?.value;
    const rate = parseFloat(document.getElementById('curRate')?.value) || 1;
    if (!name || !symbol) return showToast('الرجاء إدخال الاسم والرمز', 'error');
    
    try {
        const { error } = await supabase
            .from('currencies')
            .insert([{ name, symbol, exchangeRate: rate, createdAt: new Date().toISOString() }]);
        
        if (error) throw error;
        
        showToast('✅ تمت الإضافة');
        closeModal('currenciesModal');
        loadCurrencies();
    } catch (error) {
        console.error(error);
        showToast('فشل الإضافة', 'error');
    }
};

window.editCurrency = async function(id) {
    showToast('🚧 التعديل قيد التطوير', 'info');
};

window.deleteCurrency = async function(id) {
    if (!confirm('حذف العملة؟')) return;
    try {
        const { error } = await supabase
            .from('currencies')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم الحذف');
        loadCurrencies();
    } catch (error) {
        console.error(error);
        showToast('فشل الحذف', 'error');
    }
};

// ==================== نسبة ربح VIP ====================
async function loadVipProfit() {
    try {
        const { data: settings, error } = await supabase
            .from('vipSettings')
            .select('profitRate')
            .eq('id', 'default')
            .maybeSingle();
        
        if (error) throw error;
        let profitRate = settings?.profitRate || 0;
        
        const html = `
            <h3>📈 نسبة ربح VIP</h3>
            <input type="number" id="vipRate" value="${profitRate}" min="0" max="100" step="0.1">
            <button onclick="saveVipProfit()">حفظ</button>
        `;
        showModal('vipModal', html);
    } catch (error) {
        console.error(error);
        showToast('فشل تحميل إعدادات VIP', 'error');
    }
}

window.saveVipProfit = async function() {
    const rate = parseFloat(document.getElementById('vipRate')?.value) || 0;
    try {
        const { error } = await supabase
            .from('vipSettings')
            .upsert({ id: 'default', profitRate: rate }, { onConflict: 'id' });
        
        if (error) throw error;
        
        showToast('✅ تم الحفظ');
        closeModal('vipModal');
    } catch (error) {
        console.error(error);
        showToast('فشل الحفظ', 'error');
    }
};

// ==================== سجل الأرباح ====================
async function loadProfitLog() {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('price');
        
        if (error) throw error;
        
        let totalSales = 0, totalOrders = 0;
        orders.forEach(o => {
            totalSales += o.price || 0;
            totalOrders++;
        });
        
        const html = `
            <h3>💰 سجل الأرباح</h3>
            <div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="stat-card">
                    <div class="stat-title">إجمالي المبيعات</div>
                    <div class="stat-value">${totalSales.toFixed(2)}$</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">عدد الطلبات</div>
                    <div class="stat-value">${totalOrders}</div>
                </div>
            </div>
        `;
        showModal('profitLogModal', html);
    } catch (error) {
        console.error(error);
        showToast('فشل تحميل سجل الأرباح', 'error');
    }
}

// ==================== الرصيد المدين ====================
async function loadDebtBalance() {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('name, email, debtBalance, allowedDebt');
        
        if (error) throw error;
        
        let html = '<h3>💸 الرصيد المدين</h3>';
        html += '<table><tr><th>المستخدم</th><th>الرصيد</th><th>السماح</th><th>إجراءات</th></tr>';
        if (!users || users.length === 0) {
            html += '<tr><td colspan="4" style="text-align:center;">لا يوجد مستخدمين</td></tr>';
        } else {
            users.forEach(u => {
                html += `
                    <tr>
                        <td>${u.name || u.email}</td>
                        <td>${u.debtBalance || 0}$</td>
                        <td>${u.allowedDebt ? '✅' : '❌'}</td>
                        <td><button class="edit-btn" onclick="editDebtBalance('${u.id}')">✏️</button></td>
                    </tr>
                `;
            });
        }
        html += '</table>';
        showModal('debtModal', html);
    } catch (error) {
        console.error(error);
        showToast('فشل تحميل الرصيد المدين', 'error');
    }
}

window.editDebtBalance = async function(userId) {
    const { data: u, error } = await supabase
        .from('users')
        .select('name, email, debtBalance, allowedDebt')
        .eq('id', userId)
        .single();
    
    if (error || !u) return showToast('المستخدم غير موجود', 'error');
    
    const form = `
        <h3>✏️ تعديل الرصيد المدين</h3>
        <p>المستخدم: ${u.name || u.email}</p>
        <input type="number" id="debtAmount" value="${u.debtBalance || 0}" step="0.01">
        <label>السماح بالرصيد المدين:</label>
        <select id="debtAllowed">
            <option value="true" ${u.allowedDebt ? 'selected' : ''}>نعم</option>
            <option value="false" ${!u.allowedDebt ? 'selected' : ''}>لا</option>
        </select>
        <button onclick="updateDebtBalance('${userId}')">تحديث</button>
    `;
    showModal('debtModal', form);
};

window.updateDebtBalance = async function(userId) {
    const amount = parseFloat(document.getElementById('debtAmount')?.value) || 0;
    const allowed = document.getElementById('debtAllowed')?.value === 'true';
    try {
        const { error } = await supabase
            .from('users')
            .update({ debtBalance: amount, allowedDebt: allowed })
            .eq('id', userId);
        
        if (error) throw error;
        
        showToast('✅ تم التحديث');
        closeModal('debtModal');
        loadDebtBalance();
    } catch (error) {
        console.error(error);
        showToast('فشل التحديث', 'error');
    }
};

// ==================== المستخدمون الأكثر صرفاً ====================
async function loadTopSpenders() {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('userId, price');
        
        if (error) throw error;
        
        const userSpending = {};
        orders.forEach(o => {
            if (o.userId) userSpending[o.userId] = (userSpending[o.userId] || 0) + (o.price || 0);
        });
        
        const sorted = Object.entries(userSpending).sort((a, b) => b[1] - a[1]).slice(0, 10);
        let html = '<h3>🏆 المستخدمون الأكثر صرفاً</h3><table><tr><th>المستخدم</th><th>إجمالي المشتريات</th></tr>';
        if (sorted.length === 0) {
            html += '<tr><td colspan="2" style="text-align:center;">لا توجد بيانات</td></tr>';
        } else {
            for (const [userId, total] of sorted) {
                const { data: user } = await supabase
                    .from('users')
                    .select('name, email')
                    .eq('id', userId)
                    .single();
                
                const userName = user ? (user.name || user.email) : 'غير معروف';
                html += `<tr><td>${userName}</td><td>${total.toFixed(2)}$</td></tr>`;
            }
        }
        html += '</table>';
        showModal('topSpendersModal', html);
    } catch (error) {
        console.error(error);
        showToast('فشل التحميل', 'error');
    }
}

// ==================== وضع الصيانة ====================
async function toggleMaintenance() {
    try {
        const { data: current, error: fetchError } = await supabase
            .from('settings')
            .select('enabled')
            .eq('id', 'maintenance')
            .maybeSingle();
        
        if (fetchError) throw fetchError;
        
        const currentStatus = current?.enabled || false;
        const newStatus = !currentStatus;
        
        const { error } = await supabase
            .from('settings')
            .upsert({ id: 'maintenance', enabled: newStatus, updatedAt: new Date().toISOString() });
        
        if (error) throw error;
        
        showToast(newStatus ? '🔧 وضع الصيانة مفعل' : '✅ وضع الصيانة معطل', 'info');
        const maintBtn = document.querySelector('.maintenance-toggle');
        if (maintBtn) maintBtn.textContent = newStatus ? 'تعطيل وضع الصيانة' : 'تفعيل وضع الصيانة';
    } catch (error) {
        console.error(error);
        showToast('فشل تبديل وضع الصيانة', 'error');
    }
}

// ==================== دوال مؤقتة للباقي (قيد التطوير) ====================
function showVipUsers() { showToast('🚧 إدارة الدولاء قيد التطوير', 'info'); }
function showReferrals() { showToast('🚧 الإجالات قيد التطوير', 'info'); }
function showDesign() { showToast('🚧 التصميم قيد التطوير', 'info'); }
function showOrderMessages() { showToast('🚧 رسائل الطلب قيد التطوير', 'info'); }
function showOrderManagement() { showToast('🚧 إدارة الترتيب قيد التطوير', 'info'); }
function showContactMethods() { showToast('🚧 وسائل التواصل قيد التطوير', 'info'); }
function showAdminAccounts() { showToast('🚧 حسابات الإدارة قيد التطوير', 'info'); }
function showTwoFactor() { showToast('🚧 الحقوق بخطوتين قيد التطوير', 'info'); }

// ========== ربط جميع الدوال بـ window ==========
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

window.loadPaymentMethods = loadPaymentMethods;
window.loadCurrencies = loadCurrencies;
window.loadVipProfit = loadVipProfit;
window.loadProfitLog = loadProfitLog;
window.loadDebtBalance = loadDebtBalance;
window.loadTopSpenders = loadTopSpenders;
window.toggleMaintenance = toggleMaintenance;
window.showVipUsers = showVipUsers;
window.showReferrals = showReferrals;
window.showDesign = showDesign;
window.showOrderMessages = showOrderMessages;
window.showOrderManagement = showOrderManagement;
window.showContactMethods = showContactMethods;
window.showAdminAccounts = showAdminAccounts;
window.showTwoFactor = showTwoFactor;

console.log('✅ admin.js loaded with all functions (Supabase)');