// ==================== admin-extras.js (نسخة متكاملة) ====================
import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast, showModal, closeModal } from './helpers.js';

// ==================== طرق الدفع ====================
async function loadPaymentMethods() {
    try {
        const querySnapshot = await getDocs(collection(db, 'paymentMethods'));
        let html = '<h3>💳 طرق الدفع</h3>';
        html += '<button class="add-btn" onclick="showAddPaymentMethodModal()">➕ إضافة طريقة دفع جديدة</button>';
        html += '<div class="payment-methods-grid">';
        
        if (querySnapshot.empty) {
            html += '<p style="text-align:center;">لا توجد طرق دفع مضافة بعد</p>';
        } else {
            querySnapshot.forEach(doc => {
                const m = doc.data();
                html += `
                    <div class="payment-card" data-id="${doc.id}">
                        <img src="${m.image || 'https://via.placeholder.com/80'}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid #fbbf24;">
                        <div style="color:#fbbf24; font-weight:700; margin:5px 0;">${m.name}</div>
                        <div style="color:#888; font-size:12px;">${m.accountNumber || ''}</div>
                        <div style="margin-top:10px;">
                            <button class="edit-btn" onclick="editPaymentMethod('${doc.id}')">✏️</button>
                            <button class="delete-btn" onclick="deletePaymentMethod('${doc.id}')">🗑️</button>
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
        await addDoc(collection(db, 'paymentMethods'), { 
            name, 
            accountNumber: number, 
            image: image || '', 
            accountName: accountName || '',
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

// ==================== ربط الدوال بـ window (الجزء الأهم) ====================
window.loadPaymentMethods = loadPaymentMethods;

// ==================== تصدير الدوال (للاستخدام في admin.js إذا لزم الأمر) ====================
export { loadPaymentMethods };

console.log('✅ admin-extras.js loaded successfully');