/**
 * سَدِيم (Sadeem) — معايير المال والعملة الموحدة (ILS - ₪)
 * الحسابات المالية تُحفظ كـ Number بحد أقصى منزلتين عشريتين
 */

/**
 * تقريب القيمة المالية لمنزلتين عشريتين بدقة فائقة لمنع أخطاء الفاصلة العائمة
 * @param {number|string} amount
 * @returns {number}
 */
function roundMoney(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) {
        return 0;
    }
    return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
}

/**
 * فحص صحة القيمة المالية (رقم موجب بحد أقصى منزلتين عشريتين)
 * @param {any} value
 * @returns {boolean}
 */
function isMoney(value) {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        return false;
    }
    if (value < 0) {
        return false;
    }
    // التأكد من عدم وجود أكثر من خانتين عشريتين
    return Math.abs(roundMoney(value) - value) < 1e-9;
}

/**
 * تنسيق السعر للعرض مع رمز الشيكل ₪
 * @param {number} amount
 * @returns {string}
 */
function formatMoney(amount) {
    const val = roundMoney(amount);
    return `${val} ₪`;
}

module.exports = {
    roundMoney,
    isMoney,
    formatMoney,
};
