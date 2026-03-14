// ==================== wallet.js (معدل لـ Supabase) ====================
import { supabase } from './supabase-config.js';
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
    try {
        const user = supabase.auth.user();
        const uid = userId || (user ? user.id : null);
        if (!uid) return 0;

        const { data, error } = await supabase
            .from('users')
            .select('walletBalance')
            .eq('id', uid)
            .single();

        if (error) throw error;
        return data?.walletBalance || 0;
    } catch (error) {
        console.error('خطأ في جلب الرصيد:', error);
        return 0;
    }
}

// دالة تأكيد الشحن (تستخدم في admin.js)
export async function confirmCharge(chargeId, userId, amount) {
    try {
        // 1. تحديث رصيد المستخدم
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('walletBalance')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        const newBalance = (userData?.walletBalance || 0) + amount;

        const { error: updateError } = await supabase
            .from('users')
            .update({ walletBalance: newBalance })
            .eq('id', userId);

        if (updateError) throw updateError;

        // 2. تحديث حالة الشحن
        const { error: chargeError } = await supabase
            .from('charges')
            .update({ status: 'completed' })
            .eq('id', chargeId);

        if (chargeError) throw chargeError;

        // 3. إضافة سجل معاملة
        const { error: transError } = await supabase
            .from('transactions')
            .insert([{
                userId: userId,
                type: 'charge',
                amount: amount,
                description: 'شحن رصيد',
                date: new Date().toISOString()
            }]);

        if (transError) throw transError;

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
        // جلب الرصيد الحالي
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('walletBalance')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        const newBalance = (userData?.walletBalance || 0) + amount;

        // تحديث الرصيد
        const { error: updateError } = await supabase
            .from('users')
            .update({ walletBalance: newBalance })
            .eq('id', userId);

        if (updateError) throw updateError;

        // إضافة سجل معاملة
        const { error: transError } = await supabase
            .from('transactions')
            .insert([{
                userId: userId,
                type: 'charge',
                amount: amount,
                description: description,
                date: new Date().toISOString()
            }]);

        if (transError) throw transError;

        return true;
    } catch (error) {
        console.error('خطأ في إضافة الرصيد:', error);
        return false;
    }
}