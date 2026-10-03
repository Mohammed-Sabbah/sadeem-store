const crypto = require('crypto');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Category = require('../models/Category');
const PasswordReset = require('../models/PasswordReset');
const { ROLE, STATUS } = require('../constants/enums');
const { setAuthCookies, clearAuthCookies, getCookieOptions, cookieOptions } = require('../config/cookies');
const { issueAccessToken, issueRefreshToken, verifyToken } = require('../utils/token');
const { generateOtp, sendEmail } = require('../utils/email');
const { success, error, serverError } = require('../utils/responses');
const { sanitizeUser } = require("../utils/user")

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function register(req, res, next) {
    try {
        const { name, phoneNumber, email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return error(res, 409, 'Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            name: String(name).trim(),
            phoneNumber: String(phoneNumber).trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: ROLE.USER,
            status: STATUS.ACTIVE,
            isDeleted: false,
        });

        return success(res, 201, {
            message: 'User registered successfully',
            user: sanitizeUser(user),
        });
    } catch (err) {
        return next(err);
    }
}

async function registerSeller(req, res, next) {
    try {
        const userInput = req.body && req.body.user ? req.body.user : {};
        const storeInput = req.body && req.body.store ? req.body.store : {};
        const normalizedEmail = normalizeEmail(userInput.email);

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return error(res, 409, 'Email already exists');
        }

        const category = await Category.findById(storeInput.categoryId);

        if (!category) {
            return error(res, 400, 'Invalid store category');
        }

        const session = await mongoose.startSession();
        let createdUser = null;
        let createdStore = null;

        try {
            await session.withTransaction(async () => {
                const hashedPassword = await bcrypt.hash(userInput.password, 12);

                const [newUser] = await User.create(
                    [
                        {
                            name: String(userInput.name).trim(),
                            phoneNumber: String(userInput.phoneNumber).trim(),
                            email: normalizedEmail,
                            password: hashedPassword,
                            role: ROLE.SELLER,
                            status: STATUS.ACTIVE,
                            isDeleted: false,
                        },
                    ],
                    { session }
                );

                const existingStore = await Store.findOne({ ownerId: newUser._id }).session(session);

                if (existingStore) {
                    throw createError('Store already exists', 409);
                }

                const [newStore] = await Store.create(
                    [
                        {
                            ownerId: newUser._id,
                            categoryId: storeInput.categoryId,
                            name: String(storeInput.name).trim(),
                            logo: storeInput.logo || '',
                            description: storeInput.description || '',
                            address: storeInput.address || '',
                            phoneNumber: storeInput.phoneNumber || userInput.phoneNumber,
                            balance: 0,
                            status: STATUS.ACTIVE,
                            isDeleted: false,
                        },
                    ],
                    { session }
                );

                createdUser = newUser;
                createdStore = newStore;
            });
        } catch (error) {
            if (error && error.statusCode) {
                return error(res, error.statusCode, error.message);
            }

            return next(error);
        } finally {
            await session.endSession();
        }

        return success(res, 201, {
            message: 'Seller registered successfully',
            user: sanitizeUser(createdUser),
            store: createdStore.toObject ? createdStore.toObject() : createdStore,
        });
    } catch (err) {
        return next(err);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail }).select('+password');

        if (!user) {
            return error(res, 401, 'Invalid credentials');
        }

        if (user.isDeleted) {
            return error(res, 401, 'User account has been deleted');
        }

        if (user.status !== STATUS.ACTIVE) {
            return error(res, 401, 'User is inactive');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return error(res, 401, 'Invalid credentials');
        }

        const accessToken = issueAccessToken(user);
        const refreshToken = issueRefreshToken(user);

        setAuthCookies(res, accessToken, refreshToken);

        return success(res, 200, {
            message: 'Login successful',
            user: sanitizeUser(user),
        });
    } catch (err) {
        return next(err);
    }
}

async function refresh(req, res, next) {
    try {
        const refreshToken = req.cookies && req.cookies.refreshToken;

        if (!refreshToken) {
            return error(res, 401, 'Invalid or expired refresh token');
        }

        let payload;

        try {
            payload = verifyToken(refreshToken);
        } catch (err) {
            return error(res, 401, 'Invalid or expired refresh token');
        }

        if (payload.type !== 'refresh') {
            return error(res, 401, 'Invalid refresh token');
        }

        const user = await User.findById(payload.userId);

        if (!user || user.isDeleted || user.status !== STATUS.ACTIVE) {
            return error(res, 401, 'User is inactive or deleted');
        }

        const accessToken = issueAccessToken(user);
        res.cookie('accessToken', accessToken, getCookieOptions(15 * 60));

        return success(res, 200, { message: 'Access token refreshed' });
    } catch (err) {
        return next(err);
    }
}

async function logout(req, res) {
    clearAuthCookies(res);
    return success(res, 200, { message: 'Logged out successfully' });
}

async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail });

        if (user) {
            const otp = generateOtp();
            const otpHash = await bcrypt.hash(otp, 10);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await PasswordReset.findOneAndUpdate(
                { userId: user._id },
                {
                    $set: {
                        otpHash,
                        otpAttempts: 0,
                        verified: false,
                        resetTokenHash: null,
                        expiresAt,
                    },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            sendEmail(normalizedEmail, otp);
        }

        return success(res, 200, {
            message: 'If an account exists with that email, a password reset code has been sent.',
        });
    } catch (err) {
        return next(err);
    }
}

async function verifyOtp(req, res, next) {
    try {
        const normalizedEmail = normalizeEmail(req.body.email);
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return error(res, 400, 'Invalid or expired OTP');
        }

        const reset = await PasswordReset.findOne({
            userId: user._id,
            expiresAt: { $gt: new Date() },
            verified: false,
            otpAttempts: { $lt: 5 },
        }).select('+otpHash');

        if (!reset || !reset.otpHash) {
            return error(res, 400, 'Invalid or expired OTP');
        }

        const isOtpValid = await bcrypt.compare(String(req.body.otp), reset.otpHash);

        if (!isOtpValid) {
            reset.otpAttempts += 1;
            await reset.save();
            return error(res, 400, 'Invalid or expired OTP');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        reset.otpHash = undefined;
        reset.verified = true;
        reset.resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        reset.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await reset.save();

        res.cookie('passwordResetToken', resetToken, getCookieOptions(10 * 60));

        return success(res, 200, {
            message: 'OTP verified successfully',
            token: resetToken,
        });
    } catch (err) {
        return next(err);
    }
}

async function resetPassword(req, res, next) {
    try {
        const { password } = req.body;
        const token = req.body.token || (req.cookies && req.cookies.passwordResetToken);

        if (!token) {
            return error(res, 400, 'Reset token is required');
        }

        const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');
        const reset = await PasswordReset.findOne({
            resetTokenHash: hashedToken,
            expiresAt: { $gt: new Date() },
            verified: true,
        });

        if (!reset) {
            return error(res, 400, 'Invalid or expired reset token');
        }

        const user = await User.findById(reset.userId);

        if (!user) {
            await PasswordReset.deleteOne({ _id: reset._id });
            return error(res, 400, 'Invalid or expired reset token');
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        user.password = hashedPassword;
        await user.save();
        await PasswordReset.deleteOne({ _id: reset._id });
        res.clearCookie('passwordResetToken', cookieOptions);

        return success(res, 200, { message: 'Password reset successful' });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    register,
    registerSeller,
    login,
    refresh,
    logout,
    forgotPassword,
    verifyOtp,
    resetPassword,
};
