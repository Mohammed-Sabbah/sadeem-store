const User = require('../models/User');
const Store = require('../models/Store');
const { STATUS, STORE_APPROVE_STATUS, ROLE } = require('../constants/enums');
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

        if (user.status !== STATUS.ACTIVE) {
            return error(res, 401, 'User is inactive or deleted');
        }

        if (user.role === ROLE.SELLER) {
            const store = await Store.findOne({ ownerId: user._id });
            if (!store) {
                return error(res, 401, 'Store not found');
            }
            if (store.approveStatus !== STORE_APPROVE_STATUS.APPROVED) {
                return error(res, 403, 'Store is not approved');
            }
            req.store = store;
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

async function verifyActiveStore(req, res, next) {
    const store = req.store;
    if (!store || store.status !== STATUS.ACTIVE) {
        return error(res, 403, 'Store is not active');
    }
    next();
}

module.exports = {
    authenticate,
    authorize,
    verifyActiveStore
};
