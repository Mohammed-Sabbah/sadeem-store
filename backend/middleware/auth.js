const User = require('../models/User');
const { STATUS } = require('../constants/enums');
const { error } = require('../utils/responses');
const { verifyToken } = require('../utils/token');

async function authenticate(req, res, next) {
    try {
        const token = req.cookies && req.cookies.accessToken;

        if (!token) {
            return error(res, 401, 'Unauthorized');
        }

        const payload = verifyToken(token);

        if (payload.type !== 'access') {
            return error(res, 401, 'Invalid access token');
        }

        const user = await User.findById(payload.userId);
        if (!user || user.isDeleted) {
            return error(res, 401, 'User is inactive or deleted');
        }

        if (user.status === STATUS.PENDING_APPROVAL) {
            return error(res, 403, 'User is pending approval');
        }

        if (user.status !== STATUS.ACTIVE) {
            return error(res, 401, 'User is inactive or deleted');
        }

        req.user = user;
        next();
    } catch (errorResponse) {
        return error(res, 401, 'Invalid or expired access token');
    }
}

function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return error(res, 401, 'Unauthorized');
        }

        if (!allowedRoles.includes(req.user.role)) {
            return error(res, 403, 'Forbidden');
        }

        next();
    };
}

module.exports = {
    authenticate,
    authorize,
};
