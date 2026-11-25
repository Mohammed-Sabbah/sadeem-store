const User = require("../models/User");
const Store = require("../models/Store")
const Wallet = require("../models/Wallet")
const bcrypt = require('bcryptjs');
const { ROLE } = require("../constants/enums")
const { success } = require("../utils/responses")
const error = require("../utils/error")
const { sanitizeUser } = require("../utils/user")
const userService = require("../services/user.service")

// user
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

// admin
exports.listUsers = async (req, res, next) => {
    try {
        const users = await userService.listUsers(req.query)
        return success(res, 200, { users })
    } catch (err) {
        next(err)
    }
}

exports.listUser = async (req, res, next) => {
    try {
        const user = await userService.listUser(req.params.id)
        return success(res, 200, { user })
    } catch (err) {
        next(err)
    }
}

exports.changeUserStatus = async (req, res, next) => {
    try {
        const user = await userService.changeUserStatus(req.params.id, req.body.status)
        return success(res, 200, { user })
    } catch (err) {
        next(err)
    }
}

exports.changeDriverStatus = async (req, res, next) => {
    try {
        const driver = await userService.changeDriverStatus(req.params.id, req.body.status)
        return success(res, 200, { driver })
    } catch (err) {
        next(err)
    }
}

// Driver
exports.createDriver = async (req, res, next) => {
    try {
        const { email, name, phoneNumber } = req.body

        const conflicts = await userService.checkRegistrationConflicts(email, phoneNumber)
        if (conflicts)
            throw error(conflicts, 400)

        const testPass = "123456789"
        const passwordHash = await bcrypt.hash(testPass, 10)
        const driverData = { email, password: passwordHash, name, phoneNumber, role: ROLE.DRIVER }
        const driver = await User.create(driverData)
        return success(res, 201, driver)
    } catch (err) {
        next(err)
    }
}

