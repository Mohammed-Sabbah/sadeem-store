const { calculateDeliveryFee } = require('../utils/deliveryCalculator');
const { success } = require('../utils/responses');

/**
 * حساب رسوم التوصيل وفق المسافات بالـ GPS لسلة سَدِيم
 */
async function calculateFee(req, res, next) {
    try {
        const { stores, address } = req.body;

        const calculation = calculateDeliveryFee(stores, address);

        return success(res, 200, calculation);
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    calculateFee,
};
