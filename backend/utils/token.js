const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { accessTokenTTL, refreshTokenTTL } = require('../config/cookies');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev-secret-change-me');

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured in production');
}

function signToken(payload, expiresIn) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function issueAccessToken(user) {
    return signToken(
        {
            userId: user._id.toString(),
            role: user.role,
            type: 'access',
        },
        accessTokenTTL
    );
}

function issueRefreshToken(user, familyId = crypto.randomUUID()) {
    const jti = crypto.randomUUID();
    const token = signToken(
        {
            userId: user._id.toString(),
            type: 'refresh',
            jti,
            familyId,
        },
        refreshTokenTTL
    );

    return { token, jti, familyId };
}

function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = {
    JWT_SECRET,
    signToken,
    issueAccessToken,
    issueRefreshToken,
    verifyToken,
};
