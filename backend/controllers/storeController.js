const Store = require('../models/Store');
const User = require('../models/User');
const { STATUS, STORE_APPROVE_STATUS } = require('../constants/enums');
const { success, error } = require('../utils/responses');

async function approveStore(req, res, next) {
    const { id } = req.params;
    if (!id) return error(res, 400, 'Store ID is required');

    try {

        const store = await Store.findOneAndUpdate(
            {
                _id: id,
                isDeleted: false,
                approveStatus: STORE_APPROVE_STATUS.PENDING,
            },
            {
                $set: {
                    approveStatus: STORE_APPROVE_STATUS.APPROVED,
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

module.exports = {
    approveStore,
};
