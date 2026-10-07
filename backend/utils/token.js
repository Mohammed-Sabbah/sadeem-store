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

module.exports = {
    JWT_SECRET,
    signToken,
    issueAccessToken,
    issueRefreshToken,
    verifyToken,
    hashRefreshToken,
    createSession,
};
