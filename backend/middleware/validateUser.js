const {
    registerUserSchema,
    sellerRegistrationUserSchema,
    loginSchema,
    forgotPasswordSchema,
    verifyOtpSchema,
    resetPasswordSchema,
    refreshTokenSchema,
} = require('../schemas/userSchema');
const validateRequest = require('./validateRequest');

const validateRegisterUser = [...registerUserSchema, validateRequest];
const validateSellerRegistration = [...sellerRegistrationUserSchema, validateRequest];
const validateLoginUser = [...loginSchema, validateRequest];
const validateForgotPassword = [...forgotPasswordSchema, validateRequest];
const validateVerifyOtp = [...verifyOtpSchema, validateRequest];
const validateResetPassword = [...resetPasswordSchema, validateRequest];
const validateRefreshToken = [...refreshTokenSchema, validateRequest];

module.exports = {
    validateRegisterUser,
    validateSellerRegistration,
    validateLoginUser,
    validateForgotPassword,
    validateVerifyOtp,
    validateResetPassword,
    validateRefreshToken,
};
