// ==================== auth.js (معدل لـ Supabase) ====================
import { supabase } from './supabase-config.js';
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

// إنشاء ملف المستخدم (إدراج أو تحديث في جدول users)
export async function createUserProfile(user) {
    try {
        const { error } = await supabase
            .from('users')
            .upsert({
                id: user.id,                // معرف المستخدم من Supabase Auth
                email: user.email,
                name: user.user_metadata?.name || user.email.split('@')[0],
                createdAt: new Date().toISOString(),
                walletBalance: 0
            }, { onConflict: 'id' });        // إذا كان موجوداً، تحديث
        
        if (error) throw error;
    } catch (error) {
        console.error('خطأ في إنشاء ملف المستخدم:', error);
    }
}

// مراقبة حالة تسجيل الدخول
export function initAuth() {
    // الحصول على الجلسة الحالية
    const session = supabase.auth.session();
    if (session) {
        const user = session.user;
        currentUser = {
            uid: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0]
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        createUserProfile(user).then(() => updateAdminUI());
    } else {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateAdminUI();
    }

    // الاستماع لتغييرات المصادقة
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            const user = session.user;
            currentUser = {
                uid: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email.split('@')[0]
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            await createUserProfile(user);
            updateAdminUI();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateAdminUI();
        }
    });

    // إرجاع دالة لإلغاء الاشتراك إذا لزم الأمر
    return listener;
}

// تسجيل الخروج
window.logout = async function() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        showToast('❌ فشل تسجيل الخروج', 'error');
    } else {
        showToast('✅ تم تسجيل الخروج');
    }
};

// ===== دوال تسجيل الدخول (تستخدم في login.html) =====
window.adminLogin = async function(email, password) {
    try {
        const { user, error } = await supabase.auth.signIn({ email, password });
        if (error) throw error;
        
        if (user.email !== ADMIN_EMAIL) {
            await supabase.auth.signOut();
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

// تسجيل الدخول بـ Google
window.loginWithGoogle = async function() {
    try {
        const { error } = await supabase.auth.signIn({ provider: 'google' });
        if (error) throw error;
        // بعد التوجيه، سيتم التعامل معه عبر onAuthStateChange
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    }
};

// معالجة نتيجة redirect (قد تكون غير ضرورية مع Supabase)
export async function handleRedirectResult() {
    // Supabase يتعامل مع redirect تلقائياً، لكن يمكننا التحقق من الجلسة
    const session = supabase.auth.session();
    if (session) {
        const user = session.user;
        if (user.email === ADMIN_EMAIL) {
            window.location.href = 'dashboard.html';
        } else {
            await supabase.auth.signOut();
            showToast('غير مصرح', 'error');
        }
    }
}

// استدعاء initAuth عند تحميل الصفحة
initAuth();

// معالجة redirect إذا وجد (اختياري)
handleRedirectResult();