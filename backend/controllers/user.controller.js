const Store = require("../models/Store")
const Wallet = require("../models/Wallet")
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

        if (req.user.role === ROLE.USER) {
            const wallet = await Wallet.findOne({ userId: req.user._id }).lean();
            if (wallet) {
                response.wallet = wallet;
            }
        }

        return success(res, 200, response);
    } catch (err) {
        return next(err);
    }
}

const User = require("../models/User");

exports.updateProfile = async (req, res, next) => {
    try {
        const { name, phoneNumber, addresses } = req.body;
        const updates = {};
        if (typeof name === 'string' && name.trim()) updates.name = name.trim();
        if (typeof phoneNumber === 'string' && phoneNumber.trim()) updates.phoneNumber = phoneNumber.trim();
        if (Array.isArray(addresses)) updates.addresses = addresses;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        return success(res, 200, { user: sanitizeUser(updatedUser) });
    } catch (err) {
        return next(err);
    }
};
