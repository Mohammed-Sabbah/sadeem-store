/**
 * سَدِيم (Sadeem) — Gaza Strip Geographical Master Data
 * خريطة محافظات ومدن قطاع غزة ومراكزها لحساب مسافات التوصيل وتحديد نطاق الخدمة
 * 
 * مستويات الحالة التشغيلية للمحافظات (Unified 3-Tier Status):
 * - 'hub': مركز نشط (متاح تسجيل المتاجر + متاح توصيل طلبات الزبائن) ➔ المحافظة الوسطى
 * - 'delivery_only': توصيل فقط (متاح استقبال وتوصيل طلبات الزبائن، ومغلق لتسجيل المتاجر) ➔ خان يونس
 * - 'closed': خارج التغطية حالياً ➔ مدينة غزة، شمال غزة، رفح
 */

const GAZA_REGIONS = {
    central: {
        id: 'central',
        name: 'المحافظة الوسطى',
        status: 'hub',
        isActive: true,
        center: { lat: 31.428, lng: 34.375 },
        cities: [
            { id: 'deir_albalah', name: 'دير البلح', center: { lat: 31.418, lng: 34.351 } },
            { id: 'nuseirat', name: 'مخيم النصيرات', center: { lat: 31.448, lng: 34.391 } },
            { id: 'zawayda', name: 'الزوايدة', center: { lat: 31.431, lng: 34.372 } },
            { id: 'bureij', name: 'مخيم البريج', center: { lat: 31.439, lng: 34.402 } },
            { id: 'maghazi', name: 'مخيم المغازي', center: { lat: 31.423, lng: 34.385 } },
        ],
    },
    khan_younis: {
        id: 'khan_younis',
        name: 'خان يونس',
        status: 'delivery_only',
        isActive: true,
        center: { lat: 31.346, lng: 34.306 },
        cities: [
            { id: 'khan_younis_city', name: 'مدينة خان يونس والبلد', center: { lat: 31.346, lng: 34.306 } },
            { id: 'khan_younis_camp', name: 'مخيم خان يونس والأمل', center: { lat: 31.350, lng: 34.295 } },
            { id: 'qarara', name: 'القرارة', center: { lat: 31.375, lng: 34.335 } },
            { id: 'bani_suheila', name: 'بني سهيلا والشرقية', center: { lat: 31.342, lng: 34.335 } },
            { id: 'mawasi_ky', name: 'المواصي - خان يونس', center: { lat: 31.355, lng: 34.260 } },
        ],
    },
    gaza: {
        id: 'gaza',
        name: 'مدينة غزة',
        status: 'closed',
        isActive: false,
        center: { lat: 31.505, lng: 34.463 },
        cities: [
            { id: 'riman', name: 'الرمال وتل الهوا', center: { lat: 31.512, lng: 34.445 } },
            { id: 'shujaeyya', name: 'الشجاعية والدرج والتفاح', center: { lat: 31.505, lng: 34.480 } },
            { id: 'zaytoun', name: 'الزيتون والصبرة', center: { lat: 31.495, lng: 34.460 } },
            { id: 'sheikh_radwan', name: 'الشيخ رضوان والنصر', center: { lat: 31.525, lng: 34.465 } },
        ],
    },
    north: {
        id: 'north',
        name: 'شمال غزة',
        status: 'closed',
        isActive: false,
        center: { lat: 31.545, lng: 34.505 },
        cities: [
            { id: 'jabalia', name: 'جباليا ومخيمها', center: { lat: 31.528, lng: 34.485 } },
            { id: 'beit_lahia', name: 'بيت لاهيا', center: { lat: 31.545, lng: 34.505 } },
            { id: 'beit_hanoun', name: 'بيت حانون', center: { lat: 31.542, lng: 34.536 } },
        ],
    },
    rafah: {
        id: 'rafah',
        name: 'رفح',
        status: 'closed',
        isActive: false,
        center: { lat: 31.282, lng: 34.250 },
        cities: [
            { id: 'rafah_city', name: 'مدينة رفح والبلد', center: { lat: 31.282, lng: 34.250 } },
            { id: 'tel_sultan', name: 'تل السلطان والمخيم', center: { lat: 31.295, lng: 34.235 } },
            { id: 'shaboura', name: 'الشابورة والبرازيل', center: { lat: 31.285, lng: 34.255 } },
            { id: 'mawasi_rafah', name: 'المواصي - رفح', center: { lat: 31.310, lng: 34.215 } },
        ],
    },
};

module.exports = {
    GAZA_REGIONS,
};
