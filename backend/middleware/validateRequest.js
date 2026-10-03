const { validationResult } = require('express-validator');
const { error } = require('../utils/responses');

function validateRequest(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return error(res, 400, 'Validation failed');
    }

    return next();
}

module.exports = validateRequest;
