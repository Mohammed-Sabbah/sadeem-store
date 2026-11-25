const { body } = require('express-validator');

const moneyField = (field, label) =>
    body(field)
        .exists()
        .withMessage(`${label} is required`)
        .bail()
        .isFloat({ min: 0.01, max: 100000000, allow_leading_zeroes: false })
        .withMessage(`${label} must be a valid positive amount`)
        .bail()
        .custom((value) => {
            const amount = Number(value);
            return Number.isFinite(amount) && Math.round(amount * 100) === amount * 100;
        })
        .withMessage(`${label} must have at most two decimal places`);

module.exports = {
    moneyField
};
