const rateLimit = require('express-rate-limit');
const { error } = require('../utils/responses');

/**
 * محدد معدل الطلبات العام للعمليات العادية
 * 100 طلب لكل 15 دقيقة لكل عنوان IP
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return error(res, 429, 'عدد الطلبات كبير جداً، يرجى الانتظار قليلاً والمحاولة مجدداً');
    },
});

/**
 * محدد معدل الطلبات لمسارات المصادقة والتسجيل
 * 25 طلب لكل 15 دقيقة
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 25,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return error(res, 429, 'محاولات دخول أو تسجيل متكررة، يرجى الانتظار بضع دقائق للحماية');
    },
});

/**
 * محدد صارم جداً لطلب كود التحقق واستعادة كلمة المرور
 * 5 طلبات لكل 15 دقيقة لمنع هجمات التخمين والـ Brute Force
 */
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return error(res, 429, 'تم تجاوز الحد المسموح لطلب أكواد التحقق، حاول بعد 15 دقيقة');
    },
});

module.exports = {
    apiLimiter,
    authLimiter,
    passwordResetLimiter,
};
