const { error, serverError } = require('../utils/responses');

function errorHandler(err, req, res, next) {
    console.error(err);
    if (res.headersSent) {
        return next(err);
    }

    if (err.code === 11000) {
        const keyPattern = err.keyPattern || {};
        let message = 'القيمة المدخلة مكررة وموجودة مسبقاً في النظام.';
        if (keyPattern.sku) {
            message = 'رمز الصنف (SKU) مستخدم مسبقاً في متجرك. يرجى اختيار رمز آخر.';
        } else if (keyPattern.attrKey) {
            message = 'هذه التركيبة من المقاسات أو الخصائص مسجلة مسبقاً لهذا المنتج.';
        } else if (keyPattern.slug) {
            message = 'اسم الصنف أو رابطه مكرر بالفعل في متجرك.';
        }
        return error(res, 409, message);
    }

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Something went wrong' : err.message;

    if (statusCode === 500) {
        return serverError(res, message);
    }
    return error(res, statusCode, message);
}

module.exports = errorHandler;
