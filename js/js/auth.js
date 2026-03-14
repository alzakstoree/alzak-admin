// ==================== auth.js (معدل للإصدار 8) ====================
import { auth, db } from './firebase-config.js';
import { showToast } from './helpers.js';

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

// إنشاء ملف المستخدم
export async function createUserProfile(user) {
    const userRef = db.collection('users').doc(user.uid);
    const docSnap = await userRef.get();
    if (!docSnap.exists) {
        await userRef.set({
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            createdAt: new Date().toISOString(),
            walletBalance: 0
        });
    }
}

// مراقبة حالة تسجيل الدخول
export function initAuth() {
    auth.onAuthStateChanged(async (user) => {
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

// تسجيل الخروج
window.logout = async function() {
    await auth.signOut();
    showToast('✅ تم تسجيل الخروج');
};

// ===== دوال تسجيل الدخول (تستخدم في login.html) =====
window.adminLogin = async function(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        if (user.email !== ADMIN_EMAIL) {
            await auth.signOut();
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
        const googleProvider = new auth.GoogleAuthProvider(); // في الإصدار 8، يتم إنشاء provider داخل الدالة
        await auth.signInWithRedirect(googleProvider);
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    }
};

// معالجة نتيجة redirect
export async function handleRedirectResult() {
    try {
        const result = await auth.getRedirectResult();
        if (result.user) {
            const user = result.user;
            if (user.email === ADMIN_EMAIL) {
                window.location.href = 'dashboard.html';
            } else {
                await auth.signOut();
                showToast('غير مصرح', 'error');
            }
        }
    } catch (error) {
        console.error('خطأ في redirect result:', error);
    }
}

// استدعاء initAuth عند تحميل الصفحة
initAuth();

// معالجة redirect إذا وجد
handleRedirectResult();