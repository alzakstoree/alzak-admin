// ==================== admin-extras.js ====================
// وظائف إضافية للوحة التحكم (طرق الدفع، العملات، إلخ)
import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast, showModal, closeModal } from './helpers.js';

// ==================== طرق الدفع ====================
export async function loadPaymentMethods() {
    try {
        const querySnapshot = await getDocs(collection(db, 'paymentMethods'));
        let html = '<h3>💳 طرق الدفع</h3>';
        html += '<button class="add-btn" onclick="showAddPaymentMethodModal()">➕ إضافة طريقة دفع جديدة</button>';
        html += '<div class="payment-methods-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">';
        
        querySnapshot.forEach(doc => {
            const m = doc.data();
            html += `
                <div class="payment-card" data-id="${doc.id}" style="background: #1a1a1a; border: 2px solid #333; border-radius: 15px; padding: 15px; text-align: center;">
                    <img src="${m.image || 'https://via.placeholder.com/80'}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #fbbf24; margin-bottom: 10px;">
                    <div style="color: #fbbf24; font-weight: 700; margin-bottom: 5px;">${m.name}</div>
                    <div style="color: #888; font-size: 12px; margin-bottom: 10px;">${m.accountNumber || ''}</div>
                    <div style="display: flex; gap: 5px; justify-content: center;">
                        <button class="edit-btn" onclick="editPaymentMethod('${doc.id}')" style="background: #22c55e; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">✏️ تعديل</button>
                        <button class="delete-btn" onclick="deletePaymentMethod('${doc.id}')" style="background: #ef4444; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">🗑️ حذف</button>
                    </div>
                </div>
            `;
        });
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
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <input id="pmName" placeholder="الاسم" style="padding: 10px; background: #333; border: 1px solid #fbbf24; border-radius: 10px; color: white;">
            <input id="pmNumber" placeholder="رقم الحساب/المحفظة" style="padding: 10px; background: #333; border: 1px solid #fbbf24; border-radius: 10px; color: white;">
            <input id="pmImage" placeholder="رابط الصورة" style="padding: 10px; background: #333; border: 1px solid #fbbf24; border-radius: 10px; color: white;">
            <input id="pmAccountName" placeholder="اسم صاحب الحساب (اختياري)" style="padding: 10px; background: #333; border: 1px solid #fbbf24; border-radius: 10px; color: white;">
            <button onclick="savePaymentMethod()" style="background: #fbbf24; border: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer;">حفظ</button>
        </div>
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
    try {
        const docRef = doc(db, 'paymentMethods', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return showToast('غير موجود', 'error');
        const m = docSnap.data();
        
        const form = `
            <h3>✏️ تعديل طريقة الدفع</h3>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <input id="pmNameEdit" value="${m.name}" placeholder="الاسم" style="padding: 10px; background: #333; border: 1px solid #fbbf24; border-radius: 10px; color: white;">
                <input id="pmNumberEdit" value="${m.accountNumber || ''}" placeholder="رقم الحساب/المحفظة" style="padding: 10px; background: #333; border: 1px solid #fbbf24; border-radius: 10px; color: white;">
                <input id="pmImageEdit" value="${m.image || ''}" placeholder="رابط الصورة" style="padding: 10px; background: #333; border: 1px solid #fbbf24; border-radius: 10px; color: white;">
                <input id="pmAccountNameEdit" value="${m.accountName || ''}" placeholder="اسم صاحب الحساب" style="padding: 10px; background: #333; border: 1px solid #fbbf24; border-radius: 10px; color: white;">
                <button onclick="updatePaymentMethod('${id}')" style="background: #fbbf24; border: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer;">تحديث</button>
            </div>
        `;
        showModal('paymentMethodsModal', form);
    } catch (error) {
        console.error(error);
        showToast('خطأ في التحميل', 'error');
    }
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
    if (!confirm('هل أنت متأكد من حذف طريقة الدفع؟')) return;
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
        html += '<button class="add-btn" onclick="showAddCurrencyModal()">➕ إضافة عملة جديدة</button>';
        html += '<table style="width:100%; margin-top:15px; border-collapse:collapse;">';
        html += '<tr><th>الاسم</th><th>الرمز</th><th>سعر الصرف</th><th>إجراءات</th></tr>';
        querySnapshot.forEach(doc => {
            const c = doc.data();
            html += `
                <tr style="border-bottom:1px solid #333;">
                    <td style="padding:10px;">${c.name}</td>
                    <td style="padding:10px;">${c.symbol}</td>
                    <td style="padding:10px;">${c.exchangeRate || 1}</td>
                    <td style="padding:10px;">
                        <button onclick="editCurrency('${doc.id}')" style="background:#22c55e; border:none; padding:5px 10px; border-radius:5px;">✏️</button>
                        <button onclick="deleteCurrency('${doc.id}')" style="background:#ef4444; border:none; padding:5px 10px; border-radius:5px;">🗑️</button>
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
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <input id="curName" placeholder="اسم العملة" style="padding:10px; background:#333; border:1px solid #fbbf24; border-radius:10px;">
            <input id="curSymbol" placeholder="الرمز" style="padding:10px; background:#333; border:1px solid #fbbf24; border-radius:10px;">
            <input id="curRate" placeholder="سعر الصرف (اختياري)" value="1" style="padding:10px; background:#333; border:1px solid #fbbf24; border-radius:10px;">
            <button onclick="saveCurrency()" style="background:#fbbf24; border:none; padding:12px; border-radius:10px;">حفظ</button>
        </div>
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

// دوال edit/delete مشابهة لطرق الدفع (يمكن تطبيقها لاحقاً)
window.editCurrency = function(id) { showToast('🚧 التعديل قيد التطوير', 'info'); };
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
        // نفترض وجود مستند واحد في مجموعة vipSettings بالمعرف 'default'
        const docRef = doc(db, 'vipSettings', 'default');
        const docSnap = await getDoc(docRef);
        let profitRate = docSnap.exists() ? docSnap.data().profitRate || 0 : 0;
        
        const html = `
            <h3>📈 نسبة ربح VIP</h3>
            <div style="margin: 20px 0;">
                <label>نسبة الربح الحالية (%)</label>
                <input type="number" id="vipRate" value="${profitRate}" min="0" max="100" step="0.1" style="width:100%; padding:10px; background:#333; border:1px solid #fbbf24; border-radius:10px;">
            </div>
            <button onclick="saveVipProfit()" style="background:#fbbf24; border:none; padding:12px; border-radius:10px; width:100%;">حفظ</button>
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
        // حساب الأرباح من الطلبات
        const ordersSnap = await getDocs(collection(db, 'orders'));
        let totalSales = 0, totalOrders = 0;
        ordersSnap.forEach(doc => {
            totalSales += doc.data().price || 0;
            totalOrders++;
        });
        
        // هنا يمكن إضافة حساب التكاليف إذا كانت متوفرة
        const html = `
            <h3>💰 سجل الأرباح</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                <div style="background: #1a1a1a; padding: 20px; border-radius: 15px; text-align: center;">
                    <div style="color: #888;">إجمالي المبيعات</div>
                    <div style="color: #fbbf24; font-size: 24px;">${totalSales.toFixed(2)}$</div>
                </div>
                <div style="background: #1a1a1a; padding: 20px; border-radius: 15px; text-align: center;">
                    <div style="color: #888;">عدد الطلبات</div>
                    <div style="color: #fbbf24; font-size: 24px;">${totalOrders}</div>
                </div>
            </div>
            <p style="text-align: center; margin-top: 20px;">🚧 المزيد من التفاصيل قيد التطوير</p>
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
        html += '<table style="width:100%; margin-top:15px; border-collapse:collapse;">';
        html += '<tr><th>المستخدم</th><th>البريد</th><th>الرصيد المدين</th><th>حالة السماح</th><th>إجراءات</th></tr>';
        
        usersSnap.forEach(doc => {
            const u = doc.data();
            html += `
                <tr style="border-bottom:1px solid #333;">
                    <td style="padding:10px;">${u.name || u.email}</td>
                    <td style="padding:10px;">${u.email}</td>
                    <td style="padding:10px; color:#fbbf24;">${u.debtBalance || 0}$</td>
                    <td style="padding:10px;">${u.allowedDebt ? '✅' : '❌'}</td>
                    <td style="padding:10px;">
                        <button onclick="editDebtBalance('${doc.id}')" style="background:#22c55e; border:none; padding:5px 10px; border-radius:5px;">✏️</button>
                    </td>
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
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return showToast('المستخدم غير موجود', 'error');
        const u = userSnap.data();
        
        const form = `
            <h3>✏️ تعديل الرصيد المدين للمستخدم</h3>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <p><strong>${u.name || u.email}</strong></p>
                <label>الرصيد المدين الحالي: ${u.debtBalance || 0}$</label>
                <input type="number" id="debtAmount" value="${u.debtBalance || 0}" step="0.01" style="padding:10px; background:#333; border:1px solid #fbbf24; border-radius:10px;">
                <label>السماح بالرصيد المدين:</label>
                <select id="debtAllowed" style="padding:10px; background:#333; border:1px solid #fbbf24; border-radius:10px;">
                    <option value="true" ${u.allowedDebt ? 'selected' : ''}>نعم</option>
                    <option value="false" ${!u.allowedDebt ? 'selected' : ''}>لا</option>
                </select>
                <button onclick="updateDebtBalance('${userId}')" style="background:#fbbf24; border:none; padding:12px; border-radius:10px;">تحديث</button>
            </div>
        `;
        showModal('debtModal', form);
    } catch (error) {
        console.error(error);
        showToast('خطأ', 'error');
    }
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
            if (o.userId) {
                userSpending[o.userId] = (userSpending[o.userId] || 0) + (o.price || 0);
            }
        });
        
        // ترتيب تنازلي
        const sorted = Object.entries(userSpending).sort((a, b) => b[1] - a[1]).slice(0, 10);
        
        // جلب أسماء المستخدمين
        let html = '<h3>🏆 المستخدمون الأكثر صرفاً</h3><table style="width:100%; margin-top:15px;">';
        html += '<tr><th>المستخدم</th><th>إجمالي المشتريات</th></tr>';
        for (const [userId, total] of sorted) {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            const userName = userSnap.exists() ? (userSnap.data().name || userSnap.data().email) : 'غير معروف';
            html += `<tr><td style="padding:8px;">${userName}</td><td style="color:#fbbf24;">${total.toFixed(2)}$</td></tr>`;
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
        // تحديث نص الزر إذا كان موجودًا في الصفحة
        const maintBtn = document.querySelector('.maintenance-toggle');
        if (maintBtn) maintBtn.textContent = newStatus ? 'تعطيل وضع الصيانة' : 'تفعيل وضع الصيانة';
    } catch (error) {
        console.error(error);
        showToast('فشل تبديل وضع الصيانة', 'error');
    }
}

// ==================== دوال أخرى (مؤقتة أو قيد التطوير) ====================
// يمكنك إضافة دوال مماثلة لباقي الأزرار (التصميم، رسائل الطلب، إلخ) بنفس النمط.
// هنا سنضع دوال تجريبية تعرض رسالة "قيد التطوير" مؤقتاً لحين إكمالها.
window.showTopSpenders = loadTopSpenders;
window.showVipUsers = function() { showToast('🚧 إدارة الدولاء قيد التطوير', 'info'); };
window.showReferrals = function() { showToast('🚧 الإجالات قيد التطوير', 'info'); };
window.showDesign = function() { showToast('🚧 إدارة التصميم قيد التطوير', 'info'); };
window.showOrderMessages = function() { showToast('🚧 رسائل الطلب والردود قيد التطوير', 'info'); };
window.showOrderManagement = function() { showToast('🚧 إدارة الترتيب قيد التطوير', 'info'); };
window.showContactMethods = function() { showToast('🚧 وسائل التواصل قيد التطوير', 'info'); };
window.showAdminAccounts = function() { showToast('🚧 حسابات الإدارة قيد التطوير', 'info'); };
window.showTwoFactor = function() { showToast('🚧 الحقوق بخطوتين قيد التطوير', 'info'); };

// دوال عامة لفتح/إغلاق النوافذ (يمكن نقلها إلى helpers.js ولكن نضعها هنا للاكتمال)
window.showModal = showModal;
window.closeModal = closeModal;

// ربط الدوال بالنطاق العام
window.loadPaymentMethods = loadPaymentMethods;
window.loadCurrencies = loadCurrencies;
window.loadVipProfit = loadVipProfit;
window.loadProfitLog = loadProfitLog;
window.loadDebtBalance = loadDebtBalance;
window.toggleMaintenance = toggleMaintenance;