const { categorySchema } = require('../schemas/categorySchema');
const validateRequest = require('./validateRequest');

const validateCategory = [...categorySchema, validateRequest];

module.exports = {
    validateCategory,
};
