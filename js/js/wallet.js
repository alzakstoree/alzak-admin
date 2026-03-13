// ==================== wallet.js (معدل للوحة التحكم) ====================
import { db } from './firebase-config.js';
import { currentUser } from './auth.js';
import { collection, addDoc, query, where, getDocs, orderBy, limit, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from './helpers.js';

// دالة الحصول على الرصيد (قد تحتاجها لوحة التحكم لعرض رصيد المستخدمين)
export async function getWalletBalance() {
    if (!currentUser) return 0;
    const docRef = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(docRef);
    return docSnap.data()?.walletBalance || 0;
}

// دالة تأكيد الشحن (يستخدمها admin.js)
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
        
        showToast('✅ تم تأكيد الشحن');
        return true;
    } catch (error) {
        console.error('خطأ في تأكيد الشحن:', error);
        showToast('❌ فشل تأكيد الشحن', 'error');
        return false;
    }
}