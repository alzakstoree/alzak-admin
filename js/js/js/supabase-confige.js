// ==================== supabase-config.js ====================
// هذا الملف يقوم بتهيئة اتصال Supabase باستخدام المفاتيح التي حصلت عليها من لوحة التحكم

// استيراد مكتبة Supabase (يجب تحميلها عبر CDN في HTML)
// نستخدم الكائن العام supabase الذي تم إنشاؤه بواسطة CDN

const SUPABASE_URL = 'https://myzvthhbsvxydshhxwynn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_X43AaesPJbk4eAOoeb52cA_3u6HYIOB';

// تهيئة عميل Supabase (بافتراض أن المكتبة محملة عبر CDN)
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// تصدير العميل لاستخدامه في الملفات الأخرى
export { supabaseClient as supabase };