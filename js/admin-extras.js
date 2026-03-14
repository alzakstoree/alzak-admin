// ==================== admin-extras.js (معدل لـ Supabase) ====================
import { supabase } from './supabase-config.js';
import { showToast, showModal, closeModal } from './helpers.js';

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

// ==================== ربط جميع الدوال بـ window ====================
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

// ==================== تصدير الدوال ====================
export {
    loadPaymentMethods,
    loadCurrencies,
    loadVipProfit,
    loadProfitLog,
    loadDebtBalance,
    loadTopSpenders,
    toggleMaintenance
};

console.log('✅ admin-extras.js loaded successfully with all functions (Supabase)');