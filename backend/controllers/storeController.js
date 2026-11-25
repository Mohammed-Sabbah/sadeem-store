const Store = require('../models/Store');
const User = require('../models/User');
const { STATUS, APPROVE_STATUS } = require('../constants/enums');
const { success, error } = require('../utils/responses');
const storeBalanceService = require('../services/storeBalance.service');

async function getMyStore(req, res, next) {
    try {
        const store = req.store
        if (!store) return error(res, 404, "Store Not Found")
        return success(res, 200, { store })
    } catch (err) {
        next(err)
    }
}

async function getMyStoreBalance(req, res, next) {
    try {
        const balance = await storeBalanceService.getStoreBalance(req.store._id);
        return success(res, 200, { balance });
    } catch (err) {
        return next(err);
    }
}

async function getStoreBalance(req, res, next) {
    try {
        const balance = await storeBalanceService.getStoreBalance(req.params.id);
        return success(res, 200, { balance });
    } catch (err) {
        return next(err);
    }
}

async function createStorePayout(req, res, next) {
    try {
        const transaction = await storeBalanceService.createStorePayout({
            storeId: req.params.id,
            amount: req.body.amount,
            adminId: req.user._id,
        });
        return success(res, 201, { transaction });
    } catch (err) {
        return next(err);
    }
}

async function getPublicStore(req, res, next) {
    try {
        const store = await Store.findOne({
            _id: req.params.id,
            status: STATUS.ACTIVE,
            approveStatus: APPROVE_STATUS.APPROVED,
            isDeleted: false,
        })
            .select('name logo description address status approveStatus')
            .lean();

        if (!store) {
            return error(res, 404, 'Store not found');
        }

        return success(res, 200, { store });
    } catch (err) {
        return next(err);
    }
}

async function approveStore(req, res, next) {
    const { id } = req.params;
    if (!id) return error(res, 400, 'Store ID is required');

    try {
        const store = await Store.findOneAndUpdate(
            {
                _id: id,
                isDeleted: false,
                approveStatus: APPROVE_STATUS.PENDING,
                approveStatus: APPROVE_STATUS.PENDING,
            },
            {
                $set: {
                    approveStatus: APPROVE_STATUS.APPROVED,
                    status: STATUS.ACTIVE
                }
            },
            { new: true, runValidators: true }
        );

        if (!store) {
            const existingStore = await Store.findById(id).select('status isDeleted');

            if (!existingStore || existingStore.isDeleted) {
                return error(res, 404, 'Store not found');
            }

            return error(res, 409, 'Store is not pending approval');
        }

        if (store.ownerId) {
            await User.findByIdAndUpdate(store.ownerId, { $set: { status: STATUS.ACTIVE } });
        }

        return success(res, 200, {
            message: 'Store approved successfully',
            store: store.toObject(),
        });
    } catch (err) {
        return next(err);
    }
}

async function getAdminStores(req, res, next) {
    try {
        const stores = await Store.find({ isDeleted: false })
            .populate('ownerId', 'name email phoneNumber')
            .sort({ createdAt: -1 })
            .lean();

        return success(res, 200, {
            stores,
            count: stores.length,
        });
    } catch (err) {
        return next(err);
    }
}

async function toggleStoreStatus(req, res, next) {
    const { id } = req.params;
    try {
        const store = await Store.findOne({ _id: id, isDeleted: false });
        if (!store) return error(res, 404, 'Store not found');
        store.status = store.status === STATUS.ACTIVE ? STATUS.IN_ACTIVE : STATUS.ACTIVE;
        await store.save();
        return success(res, 200, {
            message: `Store ${store.status === STATUS.ACTIVE ? 'activated' : 'frozen'} successfully`,
            store: store.toObject(),
        });
    } catch (err) {
        return next(err);
    }
}

async function rejectStore(req, res, next) {
    const { id } = req.params;
    try {
        const store = await Store.findOneAndUpdate(
            { _id: id, isDeleted: false, approveStatus: APPROVE_STATUS.PENDING },
            { $set: { approveStatus: APPROVE_STATUS.REJECTED, status: STATUS.IN_ACTIVE } },
            { new: true }
        );
        if (!store) return error(res, 404, 'Pending store not found');
        return success(res, 200, { message: 'Store rejected successfully', store: store.toObject() });
    } catch (err) {
        return next(err);
    }
}


async function getPublicStores(req, res, next) {
    try {
        const stores = await Store.find({
            status: STATUS.ACTIVE,
            approveStatus: APPROVE_STATUS.APPROVED,
            isDeleted: false,
        })
            .select('name logo description address status approveStatus')
            .lean();

        return success(res, 200, { stores });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getPublicStores,
    getPublicStore,
    approveStore,
    getMyStore,
    getMyStoreBalance,
    getStoreBalance,
    createStorePayout,
    getAdminStores,
    toggleStoreStatus,
    rejectStore
};
