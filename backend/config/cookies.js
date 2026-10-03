const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
};

const accessTokenTTL = 15 * 60;
const refreshTokenTTL = 30 * 24 * 60 * 60;

function getCookieOptions(maxAgeSeconds) {
    return {
        ...cookieOptions,
        maxAge: maxAgeSeconds * 1000,
    };
}

function setAuthCookies(res, accessToken, refreshToken) {
    res.cookie('accessToken', accessToken, getCookieOptions(accessTokenTTL));
    res.cookie('refreshToken', refreshToken, getCookieOptions(refreshTokenTTL));
}

function clearAuthCookies(res) {
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
}

module.exports = {
    accessTokenTTL,
    refreshTokenTTL,
    cookieOptions,
    getCookieOptions,
    setAuthCookies,
    clearAuthCookies,
};
