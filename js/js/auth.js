// ==================== auth.js (معدل للوحة التحكم) ====================
import { auth, googleProvider } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    signInWithRedirect,
    getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from './firebase-config.js';
import { showToast } from './helpers.js';

export let currentUser = null;
export const ADMIN_EMAIL = 'alolao45y@gmail.com';

// دالة تحديث واجهة المدير (في لوحة التحكم)
function updateAdminUI() {
    const adminNameSpan = document.getElementById('adminName');
    const logoutBtn = document.getElementById('logoutBtn');
    if (currentUser) {
        if (adminNameSpan) adminNameSpan.textContent = currentUser.name || currentUser.email;
        if (logoutBtn) logoutBtn.style.display = 'block';
        // تحقق إذا كان المستخدم هو المدير
        if (currentUser.email !== ADMIN_EMAIL) {
            // إذا لم يكن مديراً، نعيد توجيهه أو نعرض رسالة
            showToast('غير مصرح بالدخول', 'error');
            setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        }
    } else {
        if (logoutBtn) logoutBtn.style.display = 'none';
        // إذا لم يكن هناك مستخدم، نوجه إلى صفحة تسجيل الدخول
        window.location.href = 'index.html';
    }
}

// مراقبة حالة تسجيل الدخول
export function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || user.email.split('@')[0]
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            await createUserProfile(user);
            updateAdminUI();
        } else {
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateAdminUI();
        }
    });
}

// إنشاء ملف المستخدم
export async function createUserProfile(user) {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
        await setDoc(userRef, {
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            createdAt: new Date().toISOString(),
            walletBalance: 0
        });
    }
}

// تسجيل الخروج
window.logout = async function() {
    await signOut(auth);
    showToast('✅ تم تسجيل الخروج');
};

// استدعاء initAuth عند تحميل الصفحة
initAuth();