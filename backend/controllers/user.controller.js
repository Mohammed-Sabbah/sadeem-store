const Store = require("../models/Store")
const { sanitizeUser } = require("../utils/user")
const { ROLE } = require("../constants/enums")
const { success } = require("../utils/responses")

exports.getMe = async (req, res, next) => {
    try {
        const response = {
            user: sanitizeUser(req.user),
        };

        if (req.user.role === ROLE.SELLER) {
            const store = await Store.findOne({ ownerId: req.user._id });

            if (store) {
                response.store = store.toObject ? store.toObject() : store;
            }
        }

        return success(res, 200, response);
    } catch (err) {
        return next(err);
    }
}
