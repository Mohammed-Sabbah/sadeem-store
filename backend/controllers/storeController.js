const Store = require('../models/Store');
const User = require('../models/User');
const { STATUS, APPROVE_STATUS } = require('../constants/enums');
const { success, error } = require('../utils/responses');

async function getMyStore(req, res, next) {
    try {
        const store = await Store.findOne({ ownerId: req.user._id, isDeleted: false })
            .populate('categoryId', 'title slug icon')
            .lean();

        if (!store) {
            return error(res, 404, 'Store not found');
        }

        return success(res, 200, {
            store,
        });
    } catch (err) {
        return next(err);
    }
}

async function toggleMyStoreStatus(req, res, next) {
    try {
        const { status } = req.body;
        if (!status || ![STATUS.ACTIVE, STATUS.IN_ACTIVE].includes(status)) {
            return error(res, 400, 'Invalid store status');
        }

        const store = await Store.findOneAndUpdate(
            { ownerId: req.user._id, isDeleted: false },
            { $set: { status } },
            { new: true }
        ).populate('categoryId', 'title slug icon');

        if (!store) {
            return error(res, 404, 'Store not found');
        }

        return success(res, 200, {
            message: `Store status updated to ${status}`,
            store: store.toObject(),
        });
    } catch (err) {
        return next(err);
    }
}

async function getStoreById(req, res, next) {
    try {
        const { id } = req.params;
        const store = await Store.findOne({
            _id: id,
            status: STATUS.ACTIVE,
            approveStatus: APPROVE_STATUS.APPROVED,
            isDeleted: false,
        })
            .populate('categoryId', 'title slug icon')
            .lean();

        if (!store) {
            return error(res, 404, 'Store not found');
        }

        return success(res, 200, {
            store,
        });
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
            },
            {
                $set: {
                    approveStatus: APPROVE_STATUS.APPROVED,
                    status: STATUS.ACTIVE,
                },
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

module.exports = {
    getMyStore,
    toggleMyStoreStatus,
    getStoreById,
    getPublicStore: getStoreById,
    approveStore,
};
