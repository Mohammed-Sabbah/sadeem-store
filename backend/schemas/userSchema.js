const { body, cookie } = require('express-validator');
const validateRequest = require('./validateRequest');

const validateRegisterUser = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),

    body('phoneNumber').default(''),

    body('phoneNumber')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^\+?[0-9\s()-]{8,20}$/)
        .withMessage('Phone number is invalid'),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Email is invalid')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('Password must contain at least one letter and one number'),
];

const validateSellerRegistration = [
    body('user.name')
        .trim()
        .notEmpty()
        .withMessage('Seller name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Seller name must be between 2 and 100 characters'),

    body('user.phoneNumber')
        .trim()
        .notEmpty()
        .withMessage('Seller phone number is required')
        .matches(/^\+?[0-9\s()-]{8,20}$/)
        .withMessage('Seller phone number is invalid'),

    body('user.email')
        .trim()
        .notEmpty()
        .withMessage('Seller email is required')
        .isEmail()
        .withMessage('Seller email is invalid')
        .normalizeEmail(),

    body('user.password')
        .notEmpty()
        .withMessage('Seller password is required')
        .isLength({ min: 8 })
        .withMessage('Seller password must be at least 8 characters long')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('Password must contain at least one letter and one number'),
];

const validateLoginUser = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Email is invalid')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),
];

const validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Email is invalid')
        .normalizeEmail(),
];

const validateVerifyOtp = [
    cookie('passwordResetToken')
        .exists()
        .withMessage('Password reset session is required')
        .notEmpty()
        .withMessage('Password reset session is required'),

    body('otp')
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
        .isNumeric()
        .withMessage('OTP must be 6 digits'),
];

const validateResetPassword = [
    cookie('passwordResetToken')
        .exists()
        .withMessage('Reset token is required')
        .notEmpty()
        .withMessage('Reset token is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('Password must contain at least one letter and one number'),
];

const validateRefreshToken = [
    cookie('refreshToken')
        .exists()
        .withMessage('Refresh token is required')
        .notEmpty()
        .withMessage('Refresh token is required'),
];

validateRegisterUser.push(validateRequest);
validateSellerRegistration.push(validateRequest);
validateLoginUser.push(validateRequest);
validateForgotPassword.push(validateRequest);
validateVerifyOtp.push(validateRequest);
validateResetPassword.push(validateRequest);
validateRefreshToken.push(validateRequest);

module.exports = {
    validateRegisterUser,
    validateSellerRegistration,
    validateLoginUser,
    validateForgotPassword,
    validateVerifyOtp,
    validateResetPassword,
    validateRefreshToken,
};
