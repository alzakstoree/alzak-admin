// ==================== wallet.js (معدل للوحة التحكم) ====================
import { db } from './firebase-config.js';
import { currentUser } from './auth.js';
import { collection, addDoc, query, where, getDocs, orderBy, limit, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from './helpers.js';

// ===== بيانات طرق الدفع (قد تحتاجها لوحة التحكم لعرضها) =====
export const paymentMethods = [
    {
        name: 'شام كاش',
        walletNumber: '053b8f0d907772543d262622121d6df2',
        image: 'https://i.ibb.co/5XhmqrJq/Screenshot-20260313-152931.jpg',
        accountName: 'اسحاق وسام الاسماعيل'
    },
    {
        name: 'يا مرسال',
        walletNumber: 'TDwUTu5vTi8oscYymqbyqcK9E3aZrtiuyk',
        image: 'https://i.ibb.co/4ZcSH80M/Screenshot-20260313-152751.jpg',
        accountName: 'ALZAK STORE'
    },
    {
        name: 'ليرات',
        walletNumber: 'L793143293',
        image: 'https://i.ibb.co/5hm3cHSk/Screenshot-20260313-153215.jpg',
        accountName: 'ALZAK STORE'
    }
];

// ===== دوال المحفظة الأساسية =====

// الحصول على رصيد مستخدم معين (إذا لم يُمرر userId، يستخدم المستخدم الحالي)
export async function getWalletBalance(userId = null) {
    const uid = userId || (currentUser ? currentUser.uid : null);
    if (!uid) return 0;
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.data()?.walletBalance || 0;
}

// دالة تأكيد الشحن (تستخدم في admin.js)
export async function confirmCharge(chargeId, userId, amount) {
    try {
        const userRef = doc(db, 'users', userId);
        const chargeRef = doc(db, 'charges', chargeId);
        
        const userDoc = await getDoc(userRef);
        const newBalance = (userDoc.data().walletBalance || 0) + amount;
        
        await updateDoc(userRef, { walletBalance: newBalance });
        await updateDoc(chargeRef, { status: 'completed' });
        
        await addDoc(collection(db, 'transactions'), {
            userId: userId,
            type: 'charge',
            amount: amount,
            description: 'شحن رصيد',
            date: new Date().toISOString()
        });
        
        showToast('✅ تم تأكيد الشحن وإضافة الرصيد');
        return true;
    } catch (error) {
        console.error('خطأ في تأكيد الشحن:', error);
        showToast('❌ فشل تأكيد الشحن: ' + error.message, 'error');
        return false;
    }
}

// (اختياري) دالة لإضافة رصيد لمستخدم معين (قد تستخدمها admin.js لاحقاً)
export async function addUserBalance(userId, amount, description = 'شحن رصيد') {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const newBalance = (userDoc.data().walletBalance || 0) + amount;
        await updateDoc(userRef, { walletBalance: newBalance });
        
        await addDoc(collection(db, 'transactions'), {
            userId: userId,
            type: 'charge',
            amount: amount,
            description: description,
            date: new Date().toISOString()
        });
        
        return true;
    } catch (error) {
        console.error('خطأ في إضافة الرصيد:', error);
        return false;
    }
}

// ===== الدوال المتعلقة بالطلبات (قد تحتاجها لوحة التحكم) =====
// يمكن إضافة دوال لعرض طلبات جميع المستخدمين هنا، لكن admin.js لديه already loadAdminOrders
// لذا نتركها كما هي، لكن نعدل showMyOrders لتعمل في بيئة admin إذا أردنا.

// ملاحظة: الدوال التالية تم إزالتها لأنها تعتمد على عناصر DOM غير موجودة في لوحة التحكم:
// - updateWalletBalance, updateWalletDisplay, showDepositModal, copyToClipboard, submitDeposit, showMyOrders, showWallet
// إذا احتجت أي منها في المستقبل، يمكن إضافتها مع تعديلها لتناسب بيئة admin.