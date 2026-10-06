const Store = require('../models/Store');
const User = require('../models/User');
const { ROLE, STATUS } = require('../constants/enums');
const { success, error } = require('../utils/responses');

async function approveStore(req, res, next) {
    try {
        const { storeId } = req.params;

        const store = await Store.findOneAndUpdate(
            {
                _id: storeId,
                isDeleted: false,
                status: STATUS.PENDING_APPROVAL,
            },
            { $set: { status: STATUS.ACTIVE } },
            { new: true, runValidators: true }
        );

        if (!store) {
            const existingStore = await Store.findById(storeId).select('status isDeleted');

            if (!existingStore || existingStore.isDeleted) {
                return error(res, 404, 'Store not found');
            }

            return error(res, 409, 'Store is not pending approval');
        }

        // Activate owner user account
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
