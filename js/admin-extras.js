// ==================== admin-extras.js ====================
import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast, showModal, closeModal } from './helpers.js';

// ==================== طرق الدفع ====================
export async function loadPaymentMethods() {
    try {
        const querySnapshot = await getDocs(collection(db, 'paymentMethods'));
        let html = '<h3>💳 طرق الدفع</h3>';
        html += '<button class="add-btn" onclick="showAddPaymentMethodModal()">➕ إضافة طريقة دفع جديدة</button>';
        html += '<div class="payment-methods-grid">';
        
        querySnapshot.forEach(doc => {
            const m = doc.data();
            html += `
                <div class="payment-card" data-id="${doc.id}">
                    <img src="${m.image || 'https://via.placeholder.com/80'}" class="payment-image">
                    <div class="payment-name">${m.name}</div>
                    <div class="payment-number">${m.accountNumber || ''}</div>
                    <div>
                        <button class="edit-btn" onclick="editPaymentMethod('${doc.id}')">✏️ تعديل</button>
                        <button class="delete-btn" onclick="deletePaymentMethod('${doc.id}')">🗑️ حذف</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        showModal('paymentMethodsModal', html);
    } catch (error) {
        console.error(error);
        showToast('فشل تحميل طرق الدفع', 'error');
    }
}

window.showAddPaymentMethodModal = function() {
    const form = `
        <h3>➕ إضافة طريقة دفع</h3>
        <input id="pmName" placeholder="الاسم">
        <input id="pmNumber" placeholder="رقم الحساب/المحفظة">
        <input id="pmImage" placeholder="رابط الصورة">
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
        await addDoc(collection(db, 'paymentMethods'), { 
            name, 
            accountNumber: number, 
            image: image || '', 
            accountName: accountName || '',
            active: true,
            createdAt: new Date().toISOString()
        });
        showToast('✅ تمت الإضافة');
        closeModal('paymentMethodsModal');
        loadPaymentMethods();
    } catch (error) {
        console.error(error);
        showToast('فشلت الإضافة', 'error');
    }
};

window.editPaymentMethod = async function(id) {
    const docSnap = await getDoc(doc(db, 'paymentMethods', id));
    if (!docSnap.exists()) return showToast('غير موجود', 'error');
    const m = docSnap.data();
    
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
        await updateDoc(doc(db, 'paymentMethods', id), { name, accountNumber: number, image, accountName });
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
        await deleteDoc(doc(db, 'paymentMethods', id));
        showToast('✅ تم الحذف');
        loadPaymentMethods();
    } catch (error) {
        console.error(error);
        showToast('فشل الحذف', 'error');
    }
};

// ==================== العملات ====================
export async function loadCurrencies() {
    try {
        const querySnapshot = await getDocs(collection(db, 'currencies'));
        let html = '<h3>💰 العملات</h3>';
        html += '<button class="add-btn" onclick="showAddCurrencyModal()">➕ إضافة عملة</button>';
        html += '<table><tr><th>الاسم</th><th>الرمز</th><th>سعر الصرف</th><th>إجراءات</th></tr>';
        querySnapshot.forEach(doc => {
            const c = doc.data();
            html += `
                <tr>
                    <td>${c.name}</td>
                    <td>${c.symbol}</td>
                    <td>${c.exchangeRate || 1}</td>
                    <td>
                        <button class="edit-btn" onclick="editCurrency('${doc.id}')">✏️</button>
                        <button class="delete-btn" onclick="deleteCurrency('${doc.id}')">🗑️</button>
                    </td>
                </tr>
            `;
        });
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
        await addDoc(collection(db, 'currencies'), { name, symbol, exchangeRate: rate, createdAt: new Date().toISOString() });
        showToast('✅ تمت الإضافة');
        closeModal('currenciesModal');
        loadCurrencies();
    } catch (error) {
        console.error(error);
        showToast('فشل الإضافة', 'error');
    }
};

window.deleteCurrency = async function(id) {
    if (!confirm('حذف العملة؟')) return;
    try {
        await deleteDoc(doc(db, 'currencies', id));
        showToast('✅ تم الحذف');
        loadCurrencies();
    } catch (error) {
        console.error(error);
        showToast('فشل الحذف', 'error');
    }
};

// ==================== نسبة ربح VIP ====================
export async function loadVipProfit() {
    try {
        const docRef = doc(db, 'vipSettings', 'default');
        const docSnap = await getDoc(docRef);
        let profitRate = docSnap.exists() ? docSnap.data().profitRate || 0 : 0;
        
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
        await setDoc(doc(db, 'vipSettings', 'default'), { profitRate: rate }, { merge: true });
        showToast('✅ تم الحفظ');
        closeModal('vipModal');
    } catch (error) {
        console.error(error);
        showToast('فشل الحفظ', 'error');
    }
};

// ==================== سجل الأرباح ====================
export async function loadProfitLog() {
    try {
        const ordersSnap = await getDocs(collection(db, 'orders'));
        let totalSales = 0, totalOrders = 0;
        ordersSnap.forEach(doc => {
            totalSales += doc.data().price || 0;
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
export async function loadDebtBalance() {
    try {
        const usersSnap = await getDocs(collection(db, 'users'));
        let html = '<h3>💸 الرصيد المدين</h3>';
        html += '<table><tr><th>المستخدم</th><th>الرصيد</th><th>السماح</th><th>إجراءات</th></tr>';
        usersSnap.forEach(doc => {
            const u = doc.data();
            html += `
                <tr>
                    <td>${u.name || u.email}</td>
                    <td>${u.debtBalance || 0}$</td>
                    <td>${u.allowedDebt ? '✅' : '❌'}</td>
                    <td><button class="edit-btn" onclick="editDebtBalance('${doc.id}')">✏️</button></td>
                </tr>
            `;
        });
        html += '</table>';
        showModal('debtModal', html);
    } catch (error) {
        console.error(error);
        showToast('فشل تحميل الرصيد المدين', 'error');
    }
}

window.editDebtBalance = async function(userId) {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return showToast('المستخدم غير موجود', 'error');
    const u = userSnap.data();
    
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
        await updateDoc(doc(db, 'users', userId), { debtBalance: amount, allowedDebt: allowed });
        showToast('✅ تم التحديث');
        closeModal('debtModal');
        loadDebtBalance();
    } catch (error) {
        console.error(error);
        showToast('فشل التحديث', 'error');
    }
};

// ==================== المستخدمون الأكثر صرفاً ====================
export async function loadTopSpenders() {
    try {
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const userSpending = {};
        ordersSnap.forEach(doc => {
            const o = doc.data();
            if (o.userId) userSpending[o.userId] = (userSpending[o.userId] || 0) + (o.price || 0);
        });
        
        const sorted = Object.entries(userSpending).sort((a, b) => b[1] - a[1]).slice(0, 10);
        let html = '<h3>🏆 المستخدمون الأكثر صرفاً</h3><table><tr><th>المستخدم</th><th>إجمالي المشتريات</th></tr>';
        for (const [userId, total] of sorted) {
            const userSnap = await getDoc(doc(db, 'users', userId));
            const userName = userSnap.exists() ? (userSnap.data().name || userSnap.data().email) : 'غير معروف';
            html += `<tr><td>${userName}</td><td>${total.toFixed(2)}$</td></tr>`;
        }
        html += '</table>';
        showModal('topSpendersModal', html);
    } catch (error) {
        console.error(error);
        showToast('فشل التحميل', 'error');
    }
}

// ==================== وضع الصيانة ====================
export async function toggleMaintenance() {
    try {
        const maintenanceRef = doc(db, 'settings', 'maintenance');
        const docSnap = await getDoc(maintenanceRef);
        const currentStatus = docSnap.exists() ? docSnap.data().enabled : false;
        const newStatus = !currentStatus;
        
        await setDoc(maintenanceRef, { enabled: newStatus, updatedAt: new Date().toISOString() });
        showToast(newStatus ? '🔧 وضع الصيانة مفعل' : '✅ وضع الصيانة معطل', 'info');
        const maintBtn = document.querySelector('.maintenance-toggle');
        if (maintBtn) maintBtn.textContent = newStatus ? 'تعطيل وضع الصيانة' : 'تفعيل وضع الصيانة';
    } catch (error) {
        console.error(error);
        showToast('فشل تبديل وضع الصيانة', 'error');
    }
}

// ==================== ربط الدوال بـ window (الأهم) ====================
window.loadPaymentMethods = loadPaymentMethods;
window.loadCurrencies = loadCurrencies;
window.loadVipProfit = loadVipProfit;
window.loadProfitLog = loadProfitLog;
window.loadDebtBalance = loadDebtBalance;
window.loadTopSpenders = loadTopSpenders;
window.toggleMaintenance = toggleMaintenance;

// دوال مؤقتة للباقي
window.showVipUsers = function() { showToast('🚧 إدارة الدولاء قيد التطوير', 'info'); };
window.showReferrals = function() { showToast('🚧 الإجالات قيد التطوير', 'info'); };
window.showDesign = function() { showToast('🚧 التصميم قيد التطوير', 'info'); };
window.showOrderMessages = function() { showToast('🚧 رسائل الطلب قيد التطوير', 'info'); };
window.showOrderManagement = function() { showToast('🚧 إدارة الترتيب قيد التطوير', 'info'); };
window.showContactMethods = function() { showToast('🚧 وسائل التواصل قيد التطوير', 'info'); };
window.showAdminAccounts = function() { showToast('🚧 حسابات الإدارة قيد التطوير', 'info'); };
window.showTwoFactor = function() { showToast('🚧 الحقوق بخطوتين قيد التطوير', 'info'); };

console.log('✅ admin-extras.js loaded and functions attached to window');