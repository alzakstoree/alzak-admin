// ==================== إعدادات Firebase ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCO_VTLgQkTOv_MkB0SEdSEYdRMi9IdMFA",
    authDomain: "alzak-store-dea53.firebaseapp.com",
    projectId: "alzak-store-dea53",
    storageBucket: "alzak-store-dea53.firebasestorage.app",
    messagingSenderId: "494547602038",
    appId: "1:494547602038:web:f9f78605414173ae63ed57"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// تصدير المتغيرات لاستخدامها في الملفات الأخرى
export { app, auth, db, googleProvider };