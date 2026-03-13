// ==================== بيانات المتجر (المنتجات والأقسام) ====================
// جميع الصور التي أرسلتها تم تضمينها هنا

export const defaultStoreData = {
    sections: [
        {
            id: 'games',
            name: 'الألعاب',
            icon: 'fa-gamepad',
            image: 'https://i.ibb.co/5CxJNZG/Screenshot-20260312-222843.jpg',
            categories: [
                {
                    id: 'pubg',
                    name: 'PUBG',
                    image: 'https://i.ibb.co/ccXyWp5v/Screenshot-20260309-045801.jpg',
                    products: [
                        { name: '60 UC', price: 0.99 },
                        { name: '300 UC + 25', price: 4.99 },
                        { name: '600 UC + 60', price: 9.99 },
                        { name: '1500 UC + 300', price: 24.99 },
                        { name: '3000 UC + 850', price: 49.99 },
                        { name: '6000 UC + 2000', price: 99.99 }
                    ]
                },
                {
                    id: 'freefire',
                    name: 'Free Fire',
                    image: 'https://i.ibb.co/ghSdR1b/Screenshot-20260309-045833.jpg',
                    products: [
                        { name: '100 جوهرة', price: 1.50 },
                        { name: '341 جوهرة', price: 3.99 },
                        { name: '572 جوهرة', price: 5.99 },
                        { name: '1060 جوهرة', price: 11.99 },
                        { name: '2079 جوهرة', price: 24.99 },
                        { name: '5600 دايموند + 1150', price: 49.99 }
                    ]
                },
                {
                    id: 'cod',
                    name: 'Call of Duty',
                    image: 'https://i.ibb.co/qYCBCS7m/Screenshot-20260309-045944.jpg',
                    products: [
                        { name: '500 CP', price: 4.99 },
                        { name: '1100 CP', price: 9.99 },
                        { name: '2400 CP', price: 19.99 },
                        { name: '5000 CP', price: 39.99 },
                        { name: '10000 CP', price: 79.99 }
                    ]
                }
            ]
        },
        {
            id: 'apps',
            name: 'التطبيقات',
            icon: 'fa-mobile-alt',
            image: 'https://i.ibb.co/S45Nv2TH/Screenshot-20260312-001846.jpg',
            categories: [
                {
                    id: 'shahid',
                    name: 'شاهد VIP',
                    image: 'https://i.ibb.co/zTCxDXRc/Screenshot-20260312-220100.jpg',
                    products: [
                        { name: 'شهر واحد', price: 5.99 },
                        { name: '3 شهور', price: 15.99 },
                        { name: 'سنة كاملة', price: 49.99 }
                    ]
                },
                {
                    id: 'netflix',
                    name: 'نتفلكس',
                    image: 'https://i.ibb.co/ZpsTsKCT/Screenshot-20260312-215939.jpg',
                    products: [
                        { name: 'شهر واحد', price: 7.99 },
                        { name: '3 شهور', price: 21.99 },
                        { name: 'سنة كاملة', price: 79.99 }
                    ]
                }
            ]
        },
        {
            id: 'cards',
            name: 'بطاقات جوجل',
            icon: 'fa-google',
            image: 'https://i.ibb.co/DgfqBM1Z/Screenshot-20260312-234341.jpg',
            categories: [
                {
                    id: 'google',
                    name: 'بطاقات جوجل بلاي',
                    image: 'https://i.ibb.co/DgfqBM1Z/Screenshot-20260312-234341.jpg',
                    products: [
                        { name: 'بطاقة 10$', price: 10.00 },
                        { name: 'بطاقة 25$', price: 25.00 },
                        { name: 'بطاقة 50$', price: 50.00 }
                    ]
                }
            ]
        }
    ]
};

// دالة لتحميل البيانات من localStorage أو استخدام البيانات الافتراضية
export function loadStoreData() {
    try {
        const saved = localStorage.getItem('storeData');
        return saved ? JSON.parse(saved) : defaultStoreData;
    } catch {
        return defaultStoreData;
    }
}

// دالة لحفظ البيانات (للمدير)
export function saveStoreData(data) {
    try {
        localStorage.setItem('storeData', JSON.stringify(data));
        return true;
    } catch {
        return false;
    }
}