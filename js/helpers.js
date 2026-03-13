// ==================== helpers.js ====================
// دوال مساعدة مشتركة للوحة التحكم

export function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        alert(message);
        return;
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

export function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

// ربط الدوال بـ window لتكون متاحة في onclick
window.showToast = showToast;
window.closeModal = closeModal;