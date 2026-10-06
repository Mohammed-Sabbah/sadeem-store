const { calculateDeliveryFee } = require('../utils/deliveryCalculator');
const { GAZA_REGIONS } = require('../constants/gaza-regions');
const { success } = require('../utils/responses');

const Region = require('../models/Region');

async function ensureRegionsSeeded() {
    const count = await Region.countDocuments();
    if (count === 0) {
        const orderMap = { central: 1, gaza: 2, north: 3, khan_younis: 4, rafah: 5 };
        const docs = Object.values(GAZA_REGIONS).map((reg) => ({
            code: reg.id,
            name: reg.name,
            isActive: reg.isActive,
            center: reg.center,
            cities: reg.cities,
            order: orderMap[reg.id] || 99,
        }));
        await Region.insertMany(docs);
    }
}

async function getRegions(req, res, next) {
    try {
        await ensureRegionsSeeded();
        const regions = await Region.find().sort({ order: 1 }).lean();

        // Convert to map format for backwards compatibility with any existing callers
        const regionsMap = {};
        regions.forEach((r) => {
            regionsMap[r.code] = {
                id: r.code,
                name: r.name,
                isActive: r.isActive,
                center: r.center,
                cities: r.cities,
            };
        });

        return success(res, 200, {
            regions: regionsMap,
            list: regions,
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
