// ==================== wallet.js (معدل للإصدار 8) ====================
import { auth, db } from './firebase-config.js';
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
    const uid = userId || (auth.currentUser ? auth.currentUser.uid : null);
    if (!uid) return 0;
    const docRef = db.collection('users').doc(uid);
    const docSnap = await docRef.get();
    return docSnap.data()?.walletBalance || 0;
}

// دالة تأكيد الشحن (تستخدم في admin.js)
export async function confirmCharge(chargeId, userId, amount) {
    try {
        const userRef = db.collection('users').doc(userId);
        const chargeRef = db.collection('charges').doc(chargeId);
        
        const userDoc = await userRef.get();
        const newBalance = (userDoc.data().walletBalance || 0) + amount;
        
        await userRef.update({ walletBalance: newBalance });
        await chargeRef.update({ status: 'completed' });
        
        await db.collection('transactions').add({
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
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const newBalance = (userDoc.data().walletBalance || 0) + amount;
        await userRef.update({ walletBalance: newBalance });
        
        await db.collection('transactions').add({
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