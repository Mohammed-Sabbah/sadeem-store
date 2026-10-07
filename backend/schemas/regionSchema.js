const { param, query, body } = require('express-validator');
const validateRequest = require('./validateRequest');
const { GAZA_REGIONS } = require('../constants/gaza-regions');

const regionCodes = Object.keys(GAZA_REGIONS);
const regionStatuses = ['closed', 'delivery_only', 'hub'];

const validateRegionScope = [
    query('scope')
        .optional()
        .isIn(['hub', 'merchant', 'delivery', 'customer'])
        .withMessage('Invalid region scope'),
    validateRequest,
];

const validateRegionCode = [
    param('code')
        .trim()
        .toLowerCase()
        .isIn(regionCodes)
        .withMessage('Invalid region code'),
    validateRequest,
];

const validateRegionStatus = [
    param('code')
        .trim()
        .toLowerCase()
        .isIn(regionCodes)
        .withMessage('Invalid region code'),
    body('status')
        .isIn(regionStatuses)
        .withMessage('الحالة التشغيلية غير صالحة. الخيارات المتاحة: closed, delivery_only, hub'),
    validateRequest,
];

module.exports = {
    validateRegionScope,
    validateRegionCode,
    validateRegionStatus,
};
