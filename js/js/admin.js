// ==================== admin.js (معدل للوحة التحكم) ====================
import { db } from './firebase-config.js';
import { currentUser, ADMIN_EMAIL } from './auth.js';
import { collection, getDocs, doc, updateDoc, query, orderBy, runTransaction, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { loadStoreData, saveStoreData } from './store-data.js';
import { showToast } from './helpers.js';
import { confirmCharge } from './wallet.js'; // تأكد من استيراد confirmCharge

let storeData = loadStoreData();

export function isAdmin() {
    return currentUser && currentUser.email === ADMIN_EMAIL;
}

// إظهار لوحة المدير (في dashboard.html، ستكون ظاهرة بشكل دائم، لكن نحتفظ بالدالة للمرونة)
window.showAdminPanel = function() {
    // في dashboard.html، لوحة التحكم هي الصفحة نفسها، لذا قد لا نحتاج هذه الدالة
    // لكن يمكن تركها لتحميل البيانات عند تحميل الصفحة
    loadAdminProducts();
    loadAdminOrders();
    loadAdminCharges();
    loadAdminUsers();
    loadAdminStats();
};

// التبديل بين التبويبات
window.showAdminTab = function(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    
    if (tab === 'products') loadAdminProducts();
    if (tab === 'orders') loadAdminOrders();
    if (tab === 'charges') loadAdminCharges();
    if (tab === 'users') loadAdminUsers();
    if (tab === 'stats') loadAdminStats();
};

// ===== إدارة المنتجات =====
// (نفس الكود مع تعديل showToast لاستخدام imported showToast)
window.updateProduct = function(s, c, p) {
    const name = document.getElementById(`name_${s}_${c}_${p}`).value;
    const price = parseFloat(document.getElementById(`price_${s}_${c}_${p}`).value);
    if (!name || isNaN(price)) return showToast('بيانات غير صحيحة', 'error');
    
    storeData.sections[s].categories[c].products[p].name = name;
    storeData.sections[s].categories[c].products[p].price = price;
    saveStoreData(storeData);
    showToast('✅ تم التعديل');
};

window.deleteProduct = function(s, c, p) {
    if (!confirm('حذف المنتج؟')) return;
    storeData.sections[s].categories[c].products.splice(p, 1);
    saveStoreData(storeData);
    loadAdminProducts();
    showToast('✅ تم الحذف');
};

window.addProduct = function(s, c) {
    const name = document.getElementById(`new_name_${s}_${c}`).value;
    const price = parseFloat(document.getElementById(`new_price_${s}_${c}`).value);
    if (!name || isNaN(price)) return showToast('بيانات غير صحيحة', 'error');
    
    storeData.sections[s].categories[c].products.push({ name, price });
    saveStoreData(storeData);
    document.getElementById(`new_name_${s}_${c}`).value = '';
    document.getElementById(`new_price_${s}_${c}`).value = '';
    loadAdminProducts();
    showToast('✅ تمت الإضافة');
};

// ===== إدارة الطلبات =====
// (نفس الكود مع استبدال showToast)
window.updateOrderStatus = async function(orderId) {
    const select = document.getElementById(`order_${orderId}`);
    if (!select) return;
    
    await updateDoc(doc(db, 'orders', orderId), {
        status: select.value
    });
    
    showToast('✅ تم التحديث');
    loadAdminOrders();
};

// ===== إدارة طلبات الشحن =====
// (نستخدم confirmCharge المستوردة من wallet.js)
window.confirmCharge = async function(chargeId, userId, amount) {
    if (!isAdmin()) return;
    await confirmCharge(chargeId, userId, amount);
    loadAdminCharges(); // إعادة تحميل القائمة بعد التأكيد
};

// ===== إدارة العملاء والإحصائيات =====
// (نفس الكود)