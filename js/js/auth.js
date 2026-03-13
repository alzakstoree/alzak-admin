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
import { showToast } from './helpers.js'; // استيراد showToast من helpers

export let currentUser = null;
export const ADMIN_EMAIL = 'alolao45y@gmail.com';

// دالة التحقق من أن المستخدم الحالي هو المدير
export function isAdmin() {
    return currentUser && currentUser.email === ADMIN_EMAIL;
}

// دالة تحديث واجهة المدير (خاصة بلوحة التحكم)
export function updateAdminUI() {
    const adminNameSpan = document.getElementById('adminName');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (currentUser) {
        if (adminNameSpan) adminNameSpan.textContent = currentUser.name || currentUser.email;
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        // إذا كان المستخدم ليس مديراً، نخرجه
        if (currentUser.email !== ADMIN_EMAIL) {
            showToast('غير مصرح بالدخول', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    } else {
        if (adminNameSpan) adminNameSpan.textContent = '';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        // إذا كنا في صفحة dashboard ولم يكن هناك مستخدم، نوجه إلى login
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'login.html';
        }
    }
}

// إنشاء ملف المستخدم (نفس الكود)
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

// مراقبة حالة تسجيل الدخول (معدلة)
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
            updateAdminUI(); // تحديث واجهة المدير
        } else {
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateAdminUI();
        }
    });
}

// تسجيل الخروج
window.logout = async function() {
    await signOut(auth);
    showToast('✅ تم تسجيل الخروج');
    // التوجيه سيتم تلقائياً عبر onAuthStateChanged
};

// ===== دوال تسجيل الدخول (تستخدم في login.html) =====
window.adminLogin = async function(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        if (user.email !== ADMIN_EMAIL) {
            await signOut(auth);
            showToast('❌ غير مصرح بالدخول إلى لوحة الإدارة', 'error');
            return false;
        }
        
        showToast('✅ مرحباً أيها المدير');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        return true;
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
        return false;
    }
};

// (اختياري) إذا أردت استخدام Google Sign-In في لوحة التحكم
window.loginWithGoogle = async function() {
    try {
        await signInWithRedirect(auth, googleProvider);
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    }
};

// معالجة نتيجة redirect (قد لا تحتاجها في لوحة التحكم)
export async function handleRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            const user = result.user;
            if (user.email === ADMIN_EMAIL) {
                window.location.href = 'dashboard.html';
            } else {
                await signOut(auth);
                showToast('غير مصرح', 'error');
            }
        }
    } catch (error) {
        console.error('خطأ في redirect result:', error);
    }
}

// استدعاء initAuth عند تحميل الصفحة
initAuth();

// إذا كنت تريد معالجة redirect، يمكنك استدعاؤها هنا
handleRedirectResult();