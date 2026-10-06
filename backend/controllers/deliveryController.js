const { calculateDeliveryFee } = require('../utils/deliveryCalculator');
const { GAZA_REGIONS } = require('../constants/gaza-regions');
const { success } = require('../utils/responses');

async function getRegions(req, res, next) {
    try {
        return success(res, 200, {
            regions: GAZA_REGIONS,
        });
    } catch (err) {
        return next(err);
    }
}

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
    getRegions,
    calculateFee,
};
