// ==================== دوال لوحة المدير (بدون Firebase) ====================

// ---------- دوال تسجيل الدخول ----------
const ADMIN_PASSWORD = "123456"; // غيرها لكلمة مرور قوية

// التحقق من حالة تسجيل الدخول عند تحميل الصفحة
(function() {
    if (localStorage.getItem('adminLogged') === 'yes') {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        showAdminTab('products');
    }
})();

// دالة تسجيل الدخول
window.checkPassword = function() {
    const pass = document.getElementById('adminPassword').value;
    if (pass === ADMIN_PASSWORD) {
        localStorage.setItem('adminLogged', 'yes');
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        showToast('✅ تم تسجيل الدخول بنجاح');
        showAdminTab('products');
    } else {
        showToast('❌ كلمة مرور خاطئة');
    }
};

// دالة تسجيل الخروج
window.logout = function() {
    localStorage.removeItem('adminLogged');
    location.reload();
};

// دالة عرض الإشعارات (toast)
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.backgroundColor = message.includes('✅') ? '#4CAF50' : '#f44336';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ---------- دوال التحقق من المدير ----------
function isAdmin() {
    return localStorage.getItem('adminLogged') === 'yes';
}

// ---------- بيانات المتجر (localStorage) ----------
function loadStoreData() {
    let data = localStorage.getItem('storeData');
    if (data) {
        return JSON.parse(data);
    } else {
        // بيانات افتراضية للمتجر
        return {
            sections: [
                {
                    name: "الألعاب",
                    categories: [
                        {
                            name: "PUBG",
                            products: [
                                { name: "شدات PUBG 1000 UC", price: 10 },
                                { name: "شدات PUBG 2000 UC", price: 18 }
                            ]
                        },
                        {
                            name: "Free Fire",
                            products: [
                                { name: "شدات Free Fire 500", price: 8 },
                                { name: "شدات Free Fire 1000", price: 15 }
                            ]
                        }
                    ]
                },
                {
                    name: "التطبيقات",
                    categories: [
                        {
                            name: "Google Play",
                            products: [
                                { name: "بطاقة Google Play 10$", price: 12 },
                                { name: "بطاقة Google Play 20$", price: 22 }
                            ]
                        }
                    ]
                }
            ]
        };
    }
}

function saveStoreData(data) {
    localStorage.setItem('storeData', JSON.stringify(data));
}

let storeData = loadStoreData();

// ---------- دوال إظهار وإخفاء لوحة المدير ----------
window.showAdminPanel = function() {
    if (!isAdmin()) {
        showToast('❌ غير مصرح لك بالدخول');
        return;
    }
    document.getElementById('adminPanel').style.display = 'block';
    loadAdminProducts();
    loadAdminOrders();
    loadAdminUsers();
    loadAdminStats();
};

window.hideAdminPanel = function() {
    document.getElementById('adminPanel').style.display = 'none';
};

// ---------- التبديل بين التبويبات ----------
window.showAdminTab = function(tab) {
    // إزالة class active من جميع الأزرار والمحتويات
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

    // إضافة active للزر المناسب (حسب النص)
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.textContent.includes(tab === 'products' ? 'المنتجات' : tab === 'orders' ? 'الطلبات' : tab === 'users' ? 'العملاء' : 'الإحصائيات')) {
            btn.classList.add('active');
        }
    });

    // إظهار المحتوى المناسب
    document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    
    if (tab === 'products') loadAdminProducts();
    if (tab === 'orders') loadAdminOrders();
    if (tab === 'users') loadAdminUsers();
    if (tab === 'stats') loadAdminStats();
};

// ===== إدارة المنتجات =====
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
    if (!name || isNaN(price)) return showToast('❌ بيانات غير صحيحة');
    
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
    if (!name || isNaN(price)) return showToast('❌ بيانات غير صحيحة');
    
    storeData.sections[s].categories[c].products.push({ name, price });
    saveStoreData(storeData);
    document.getElementById(`new_name_${s}_${c}`).value = '';
    document.getElementById(`new_price_${s}_${c}`).value = '';
    loadAdminProducts();
    showToast('✅ تمت الإضافة');
};

// ===== إدارة الطلبات =====
function loadAdminOrders() {
    if (!isAdmin()) return;
    
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    let html = '<h3>📋 جميع الطلبات</h3>';
    
    if (orders.length === 0) {
        html += '<p style="text-align: center;">لا توجد طلبات</p>';
    } else {
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        orders.forEach((order, index) => {
            html += `
                <div style="background: #1a1a1a; border-radius: 10px; padding: 15px; margin-bottom: 10px;">
                    <div><strong>${order.product}</strong> - ${order.price}$</div>
                    <div style="font-size: 12px;">المستخدم: ${order.userEmail || 'غير معروف'}</div>
                    <div style="font-size: 12px;">معرف: ${order.playerId || 'غير محدد'}</div>
                    <div style="font-size: 10px; color: #666;">${new Date(order.date).toLocaleString()}</div>
                    <select id="order_${index}" style="width: 100%; margin: 10px 0; padding: 8px; background: #333; color: #fff; border: 1px solid #fbbf24; border-radius: 5px;">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ قيد الانتظار</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>✅ مكتمل</option>
                    </select>
                    <button onclick="updateOrderStatus(${index})" style="width: 100%; background: #fbbf24; color: #000; border: none; padding: 8px; border-radius: 5px; font-weight: 700;">تحديث الحالة</button>
                </div>
            `;
        });
    }
    
    document.getElementById('adminOrders').innerHTML = html;
}

window.updateOrderStatus = function(index) {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    const select = document.getElementById(`order_${index}`);
    if (!select) return;
    
    orders[index].status = select.value;
    localStorage.setItem('orders', JSON.stringify(orders));
    showToast('✅ تم التحديث');
    loadAdminOrders();
};

// ===== إدارة العملاء =====
function loadAdminUsers() {
    if (!isAdmin()) return;
    
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let html = '<h3>👥 العملاء</h3><table style="width: 100%; border-collapse: collapse;">';
    html += '<tr><th>الاسم</th><th>البريد</th><th>الرصيد</th><th>تاريخ التسجيل</th></tr>';
    
    if (users.length === 0) {
        html += '<tr><td colspan="4" style="text-align: center;">لا يوجد عملاء</td></tr>';
    } else {
        users.forEach(user => {
            html += `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #333;">${user.name || 'غير معروف'}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #333;">${user.email || '—'}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #333; color: #fbbf24;">${user.walletBalance || 0}$</td>
                    <td style="padding: 8px; border-bottom: 1px solid #333; font-size: 10px;">${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
            `;
        });
    }
    
    html += '</table>';
    document.getElementById('adminUsers').innerHTML = html;
}

// ===== الإحصائيات =====
function loadAdminStats() {
    if (!isAdmin()) return;
    
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    let totalOrders = orders.length;
    let totalSales = orders.reduce((sum, o) => sum + (o.price || 0), 0);
    let pendingOrders = orders.filter(o => o.status === 'pending').length;
    
    document.getElementById('adminStats').innerHTML = `
        <h3>📊 الإحصائيات</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div style="background: #1a1a1a; border-radius: 15px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; color: #fbbf24;">${users.length}</div>
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
}