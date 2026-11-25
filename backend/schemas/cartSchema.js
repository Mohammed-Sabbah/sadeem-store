const { body } = require('express-validator');
const validateRequest = require('./validateRequest');

const owner = body('ownerId').isMongoId();
const revision = body('revision').custom(value => Number.isSafeInteger(value) && value >= 0);
const quantity = field => body(field).isInt({ min: 1, max: 1000 }).custom(value => typeof value === 'number');
const optionalPrice = field => body(field).optional().custom(value => typeof value === 'number' && Number.isFinite(value) && value >= 0);
const fields = allowed => body().custom(value => {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) {
        throw new Error('Unsupported cart fields');
    }
    return true;
});

const validateCartChange = [
    fields(['ownerId', 'revision', 'action', 'variantId', 'quantity', 'price']),
    owner, revision,
    body('action').isIn(['add', 'set', 'remove', 'clear']),
    body('variantId').if(body('action').not().equals('clear')).isMongoId(),
    body('quantity').if(body('action').isIn(['add', 'set']))
        .isInt({ min: 1, max: 1000 }).custom(value => typeof value === 'number'),
    optionalPrice('price'), validateRequest,
];

const validateCartImport = [
    fields(['ownerId', 'revision', 'items']), owner, revision,
    body('items').isArray({ min: 1, max: 50 }),
    body('items.*').custom(value => {
        if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !['variantId', 'quantity', 'price'].includes(key))) {
            throw new Error('Unsupported cart item fields');
        }
        return true;
    }),
    body('items.*.variantId').isMongoId(), quantity('items.*.quantity'), optionalPrice('items.*.price'),
    validateRequest,
];

module.exports = { validateCartChange, validateCartImport };
