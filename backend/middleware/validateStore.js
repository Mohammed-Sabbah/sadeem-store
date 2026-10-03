const { storeSchema } = require('../schemas/storeSchema');
const validateRequest = require('./validateRequest');

const validateSellerStore = [...storeSchema, validateRequest];

module.exports = {
    validateSellerStore,
};
