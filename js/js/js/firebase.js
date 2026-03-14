// ==================== إعدادات Firebase (للإصدار 8) ====================
// لا حاجة للاستيراد، لأن Firebase محمل عبر CDN

const firebaseConfig = {
    apiKey: "AIzaSyCO_VTLgQkTOv_MkB0SEdSEYdRMi9IdMFA",
    authDomain: "alzak-store-dea53.firebaseapp.com",
    projectId: "alzak-store-dea53",
    storageBucket: "alzak-store-dea53.firebasestorage.app",
    messagingSenderId: "494547602038",
    appId: "1:494547602038:web:f9f78605414173ae63ed57"
};

// تهيئة Firebase (إذا لم تكن مهيأة مسبقاً)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// تصدير المتغيرات لاستخدامها في الملفات الأخرى
export { auth, db, googleProvider };