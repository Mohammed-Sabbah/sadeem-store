const { validationResult } = require('express-validator');

function validateRequest(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'fail',
            msg: 'Validation failed',
            errors: errors.array().map(({ location, path, msg }) => ({
                location,
                field: path,
                message: msg,
            })),
        });
    }

    return next();
}

module.exports = validateRequest;
