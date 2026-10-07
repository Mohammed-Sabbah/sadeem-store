const { body, param } = require('express-validator');
const mongoose = require('mongoose');
const validateRequest = require('./validateRequest');
const Region = require('../models/Region');
const { GAZA_REGIONS } = require('../constants/gaza-regions');
const { calculateHaversineDistance } = require('../utils/deliveryCalculator');

async function getDynamicHubGovernorates() {
    try {
        const hubs = await Region.find({ status: 'hub' }).select('code').lean();
        if (hubs && hubs.length > 0) {
            return hubs.map((h) => h.code);
        }
    } catch {}
    return Object.values(GAZA_REGIONS)
        .filter((region) => region.status === 'hub')
        .map((region) => region.id);
}

function matchNearestGovernorate(lat, lng) {
    let minDistance = Infinity;
    let matchedGov = null;
    Object.values(GAZA_REGIONS).forEach((gov) => {
        gov.cities.forEach((city) => {
            const d = calculateHaversineDistance(lat, lng, city.center.lat, city.center.lng);
            if (d < minDistance) {
                minDistance = d;
                matchedGov = gov.id;
            }
        });
    });
    return matchedGov;
}

const validateSellerStore = [
    body('store.name')
        .trim()
        .notEmpty()
        .withMessage('Store name is required')
        .isLength({ min: 2, max: 150 })
        .withMessage('Store name must be between 2 and 150 characters'),

    body('store.categoryId')
        .trim()
        .notEmpty()
        .withMessage('Store category is required'),

    body('store.logo')
        .optional()
        .isString()
        .withMessage('Store logo must be a string')
        .trim(),
    body('store.description')
        .optional()
        .isString()
        .withMessage('Store description must be a string')
        .trim(),
    body('store.phoneNumber')
        .optional()
        .trim()
        .matches(/^\+?[0-9\s()-]{8,20}$/)
        .withMessage('Store phone number is invalid'),

    body('store.address')
        .isObject()
        .withMessage('Store address must be an object'),
    body('store.address.governorate')
        .trim()
        .custom(async (gov) => {
            const allowedHubs = await getDynamicHubGovernorates();
            if (!allowedHubs.includes(gov)) {
                throw new Error('تسجيل المتاجر متاح حالياً للمحافظات ذات المركز المعتمد فقط');
            }
            return true;
        }),
    body('store.address.city')
        .trim()
        .custom(async (city, { req }) => {
            const governorateCode = req.body.store?.address?.governorate;
            let region = null;
            try {
                region = await Region.findOne({ code: governorateCode }).lean();
            } catch {}
            if (!region) region = GAZA_REGIONS[governorateCode];
            const isValidCity = Boolean(region && region.cities.some((regionCity) => regionCity.id === city));
            if (!isValidCity) {
                throw new Error('المدينة أو المخيم المحدد لا يتبع للمحافظة المختارة');
            }
            return true;
        }),
    body('store.address.detailedAddress')
        .trim()
        .notEmpty()
        .withMessage('Detailed store address is required')
        .isLength({ min: 5 })
        .withMessage('Detailed store address must be at least 5 characters'),

    // Mandatory GPS Coordinates within Gaza Bounds and within Active Hub
    body('store.address.coordinates')
        .notEmpty()
        .withMessage('Store GPS coordinates are mandatory')
        .isObject()
        .withMessage('Store coordinates must be an object')
        .custom(async (coords) => {
            const lat = Number(coords.lat);
            const lng = Number(coords.lng);
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                throw new Error('إحداثيات الـ GPS غير مكتملة');
            }
            if (lat < 31.18 || lat > 31.62 || lng < 34.15 || lng > 34.60) {
                throw new Error('إحداثيات المتجر تقع خارج نطاق قطاع غزة');
            }
            const nearestGov = matchNearestGovernorate(lat, lng);
            const allowedHubs = await getDynamicHubGovernorates();
            if (!allowedHubs.includes(nearestGov)) {
                throw new Error('موقع المتجر الجغرافي يقع خارج نطاق المحافظات ذات المركز المعتمد حالياً');
            }
            return true;
        }),
    body('store.address.coordinates.lat')
        .notEmpty()
        .withMessage('Store GPS latitude is mandatory')
        .toFloat(),
    body('store.address.coordinates.lng')
        .notEmpty()
        .withMessage('Store GPS longitude is mandatory')
        .toFloat(),
    body('store.address.isDefault')
        .optional()
        .isBoolean()
        .withMessage('Address isDefault must be a boolean')
        .toBoolean(),

    body('store').customSanitizer((store, { req }) => {
        const storeInput = store || {};
        const userInput = req.body.user || {};
        const address = storeInput.address || {};

        return {
            ...storeInput,
            categoryIdIsObjectId: mongoose.Types.ObjectId.isValid(storeInput.categoryId),
            address: {
                ...address,
                isDefault: address.isDefault ?? false,
            },
            logo: storeInput.logo || '',
            description: storeInput.description || '',
            phoneNumber: storeInput.phoneNumber || userInput.phoneNumber,
        };
    }),
];

const validateStoreId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid store ID'),
    validateRequest,
];

validateSellerStore.push(validateRequest);

module.exports = {
    validateSellerStore,
    validateStoreId,
};
