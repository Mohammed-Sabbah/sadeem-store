/**
 * سَدِيم (Sadeem) — Centralized Delivery & Pricing Configuration
 * وحدة إعدادات تسعير ورسوم التوصيل المركزية لمنصة سَدِيم
 */

module.exports = {
    // سعر الكيلومتر الواحد بالشيكل
    RATE_PER_KM: 2,

    // الحد الأدنى لسعر التوصيل (Floor)
    MIN_FEE: 7,

    // الحد الأقصى لسعر التوصيل (Ceiling)
    MAX_FEE: 80,

    // رسم وقفة إضافية لكل متجر إضافي في نفس الشحنة/المحافظة
    ADDITIONAL_STORE_FEE: 4,

    // العملة الرسمية
    CURRENCY: 'ILS',
};
