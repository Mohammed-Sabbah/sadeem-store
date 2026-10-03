const jwt = require('jsonwebtoken');
const { accessTokenTTL, refreshTokenTTL } = require('../config/cookies');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

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

function issueRefreshToken(user) {
    return signToken(
        {
            userId: user._id.toString(),
            type: 'refresh',
        },
        refreshTokenTTL
    );
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
