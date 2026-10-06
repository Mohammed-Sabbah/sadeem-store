const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Category = require('../models/Category');
const Wallet = require('../models/Wallet');
const Otp = require('../models/otp.model');
const RefreshToken = require('../models/refreshToken.model');
const { ROLE, STATUS } = require('../constants/enums');
const { setAuthCookies, clearAuthCookies, getCookieOptions, cookieOptions } = require('../config/cookies');
const { issueAccessToken, issueRefreshToken, verifyToken } = require('../utils/token');
const { generateOtp, sendEmail } = require('../utils/email');
const { success, error } = require('../utils/responses');
const { sanitizeUser } = require("../utils/user")

function hashRefreshToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

async function createSession(user, res) {
    const accessToken = issueAccessToken(user);
    const refresh = issueRefreshToken(user);
    const payload = verifyToken(refresh.token);

    await RefreshToken.create({
        userId: user._id,
        tokenHash: hashRefreshToken(refresh.token),
        jti: refresh.jti,
        familyId: refresh.familyId,
        expiresAt: new Date(payload.exp * 1000),
    });

    setAuthCookies(res, accessToken, refresh.token);
}

async function checkRegistrationConflicts(email, phoneNumber) {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return 'Email already exists';
    }

    if (phoneNumber && await User.findOne({ phoneNumber })) {
        return 'Phone number already exists';
    }

    return null;
}

async function createUserWithWallet(userData, session) {
    const options = session ? { session } : {};
    const [user] = await User.create([userData], options);
    await Wallet.create([{ userId: user._id, balance: 0, currency: 'ILS' }], options);
    return user;
}

async function withMongoTransaction(callback) {
    const session = await mongoose.startSession();

    try {
        return await session.withTransaction(() => callback(session));
    } catch (txError) {
        const isNoReplicaSet = txError && txError.message && (
            txError.message.includes('replica set') || 
            txError.message.includes('Transaction numbers are only allowed')
        );

        if (isNoReplicaSet) {
            return await callback(null);
        }
        throw txError;
    } finally {
        await session.endSession();
    }
}

async function register(req, res, next) {
    try {
        const { name, phoneNumber, email, password } = req.body;

        const conflict = await checkRegistrationConflicts(email, phoneNumber);

        if (conflict) {
            return error(res, 409, conflict);
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await withMongoTransaction((session) => createUserWithWallet({
            name,
            phoneNumber,
            email,
            password: hashedPassword,
            role: ROLE.USER,
        }, session));

        await createSession(user, res);

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
        const { user: userInput, store: storeInput } = req.body;

        const conflict = await checkRegistrationConflicts(userInput.email, userInput.phoneNumber);

        if (conflict) {
            return error(res, 409, conflict);
        }

        // Resolve Category by ObjectId or slug/title
        let category = null;
        if (storeInput.categoryId) {
            if (storeInput.categoryIdIsObjectId) {
                category = await Category.findById(storeInput.categoryId);
            }
            if (!category) {
                category = await Category.findOne({
                    $or: [
                        { slug: storeInput.categoryId },
                        { title: storeInput.categoryId },
                    ],
                }).collation({ locale: 'en', strength: 2 });
            }
        }

        if (!category) {
            return error(res, 400, 'Invalid store category');
        }

        const hashedPassword = await bcrypt.hash(userInput.password, 12);
        const { user: createdUser, store: createdStore } = await withMongoTransaction(async (session) => {
            const options = session ? { session } : {};
            const user = await createUserWithWallet(
                {
                    name: userInput.name,
                    phoneNumber: userInput.phoneNumber,
                    email: userInput.email,
                    password: hashedPassword,
                    role: ROLE.SELLER,
                    status: STATUS.PENDING_APPROVAL,
                },
                session
            );

            const [store] = await Store.create(
                [
                    {
                        ownerId: user._id,
                        categoryId: category._id,
                        name: storeInput.name,
                        logo: storeInput.logo,
                        description: storeInput.description,
                        address: storeInput.address,
                        phoneNumber: storeInput.phoneNumber,
                        status: STATUS.PENDING_APPROVAL,
                    },
                ],
                options
            );

            return { user, store };
        });

        return success(res, 201, {
            message: 'Seller registered successfully and is pending admin approval',
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
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return error(res, 401, 'Invalid credentials');
        }

        if (user.isDeleted) {
            return error(res, 401, 'User account has been deleted');
        }

        if (user.status === STATUS.PENDING_APPROVAL) {
            return error(res, 403, 'Your account is pending admin approval');
        }

        if (user.status !== STATUS.ACTIVE) {
            return error(res, 401, 'User account is inactive');
        }

        if (user.role === ROLE.SELLER) {
            const store = await Store.findOne({ ownerId: user._id });
            if (store && store.status === STATUS.PENDING_APPROVAL) {
                return error(res, 403, 'Your merchant store is pending admin approval');
            }
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return error(res, 401, 'Invalid credentials');
        }

        await createSession(user, res);

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

        let payload;

        try {
            payload = verifyToken(refreshToken);
        } catch (err) {
            return error(res, 401, 'Invalid or expired refresh token');
        }

        if (payload.type !== 'refresh') {
            return error(res, 401, 'Invalid refresh token');
        }

        if (
            typeof payload.userId !== 'string' ||
            !mongoose.Types.ObjectId.isValid(payload.userId) ||
            typeof payload.jti !== 'string' ||
            !payload.jti ||
            typeof payload.familyId !== 'string' ||
            !payload.familyId ||
            !Number.isInteger(payload.exp)
        ) {
            return error(res, 401, 'Invalid refresh token');
        }

        const tokenHash = hashRefreshToken(refreshToken);
        const storedToken = await RefreshToken.findOne({
            tokenHash,
            jti: payload.jti,
            familyId: payload.familyId,
            userId: payload.userId,
        });

        if (!storedToken) {
            return error(res, 401, 'Invalid or expired refresh token');
        }

        if (storedToken.revokedAt) {
            await RefreshToken.updateMany(
                { familyId: storedToken.familyId, revokedAt: null },
                { $set: { revokedAt: new Date() } }
            );
            return error(res, 401, 'Refresh token reuse detected. Please log in again.');
        }

        const now = new Date();

        if (storedToken.expiresAt <= now) {
            return error(res, 401, 'Invalid or expired refresh token');
        }

        const user = await User.findById(payload.userId);

        if (!user || user.isDeleted || user.status !== STATUS.ACTIVE) {
            return error(res, 401, 'User is inactive or deleted');
        }

        const accessToken = issueAccessToken(user);
        const nextRefresh = issueRefreshToken(user, storedToken.familyId);
        const nextPayload = verifyToken(nextRefresh.token);
        const [replacement] = await RefreshToken.create([{
            userId: user._id,
            tokenHash: hashRefreshToken(nextRefresh.token),
            jti: nextRefresh.jti,
            familyId: nextRefresh.familyId,
            expiresAt: new Date(nextPayload.exp * 1000),
        }]);

        const rotation = await RefreshToken.updateOne(
            {
                _id: storedToken._id,
                tokenHash,
                revokedAt: null,
                expiresAt: { $gt: now },
            },
            {
                $set: {
                    revokedAt: now,
                },
            }
        );

        if (rotation.modifiedCount !== 1) {
            await RefreshToken.deleteOne({ _id: replacement._id });

            const currentToken = await RefreshToken.findById(storedToken._id);

            if (currentToken && currentToken.revokedAt) {
                await RefreshToken.updateMany(
                    { familyId: currentToken.familyId, revokedAt: null },
                    { $set: { revokedAt: new Date() } }
                );
                return error(res, 401, 'Refresh token reuse detected. Please log in again.');
            }

            return error(res, 401, 'Invalid or expired refresh token');
        }

        setAuthCookies(res, accessToken, nextRefresh.token);

        return success(res, 200, { message: 'Access token refreshed' });
    } catch (err) {
        return next(err);
    }
}

async function logout(req, res, next) {
    try {
        const refreshToken = req.cookies && req.cookies.refreshToken;

        if (refreshToken) {
            const storedToken = await RefreshToken.findOne({ tokenHash: hashRefreshToken(refreshToken) });

            if (storedToken) {
                await RefreshToken.updateMany(
                    { familyId: storedToken.familyId, revokedAt: null },
                    { $set: { revokedAt: new Date() } }
                );
            }
        }

        clearAuthCookies(res);
        return success(res, 200, { message: 'Logged out successfully' });
    } catch (err) {
        return next(err);
    }
}

async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        const sessionToken = crypto.randomBytes(32).toString('hex');

        if (user && !user.isDeleted && user.status === STATUS.ACTIVE) {
            const otp = generateOtp();
            const hashedOtp = await bcrypt.hash(otp, 10);
            const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await Otp.findOneAndUpdate(
                { userId: user._id },
                {
                    $set: {
                        sentTo: email,
                        hashedOtp,
                        sessionTokenHash,
                        resetTokenHash: null,
                        attempts: 0,
                        verified: false,
                        expiresAt,
                    },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
            );

            await sendEmail(email, otp);
        }

        res.cookie('passwordResetToken', sessionToken, getCookieOptions(10 * 60));
        return success(res, 200, {
            message: 'If an account exists with that email, a password reset code has been sent.',
        });
    } catch (err) {
        return next(err);
    }
}

async function verifyOtp(req, res, next) {
    try {
        const sessionToken = req.cookies.passwordResetToken;

        const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
        const otpRecord = await Otp.findOne({
            sessionTokenHash,
            expiresAt: { $gt: new Date() },
            verified: false,
            attempts: { $lt: 5 },
        }).select('+hashedOtp +sessionTokenHash');

        if (!otpRecord || !otpRecord.hashedOtp) {
            return error(res, 400, 'Invalid or expired OTP');
        }

        const user = await User.findById(otpRecord.userId);

        if (!user || user.isDeleted || user.status !== STATUS.ACTIVE) {
            return error(res, 400, 'Invalid or expired OTP');
        }

        const isOtpValid = await bcrypt.compare(req.body.otp, otpRecord.hashedOtp);

        if (!isOtpValid) {
            await Otp.updateOne(
                { _id: otpRecord._id, verified: false, attempts: { $lt: 5 } },
                { $inc: { attempts: 1 } }
            );
            return error(res, 400, 'Invalid or expired OTP');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const updatedRecord = await Otp.findOneAndUpdate(
            {
                _id: otpRecord._id,
                sessionTokenHash,
                verified: false,
                attempts: { $lt: 5 },
            },
            {
                $set: {
                    verified: true,
                    resetTokenHash,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                },
                $unset: {
                    hashedOtp: '',
                    sessionTokenHash: '',
                },
            },
            { new: true }
        );

        if (!updatedRecord) {
            return error(res, 400, 'Invalid or expired OTP');
        }

        res.cookie('passwordResetToken', resetToken, getCookieOptions(10 * 60));
        return success(res, 200, { message: 'OTP verified successfully' });
    } catch (err) {
        return next(err);
    }
}

async function resetPassword(req, res, next) {
    try {
        const { password } = req.body;
        const resetToken = req.cookies.passwordResetToken;

        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const otpRecord = await Otp.findOne({
            resetTokenHash,
            expiresAt: { $gt: new Date() },
            verified: true,
        });

        if (!otpRecord) {
            return error(res, 400, 'Invalid or expired reset token');
        }

        const user = await User.findById(otpRecord.userId);

        if (!user || user.isDeleted || user.status !== STATUS.ACTIVE) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return error(res, 400, 'Invalid or expired reset token');
        }

        const consumedRecord = await Otp.findOneAndDelete({
            _id: otpRecord._id,
            resetTokenHash,
            expiresAt: { $gt: new Date() },
            verified: true,
        });

        if (!consumedRecord) {
            return error(res, 400, 'Invalid or expired reset token');
        }

        user.password = await bcrypt.hash(password, 12);
        await user.save();
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
