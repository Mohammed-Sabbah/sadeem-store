const Wallet = require('../models/Wallet');
const { success, error } = require('../utils/responses');

async function getWallet(req, res, next) {
    try {
        const wallet = await Wallet.findOne({ userId: req.user._id }).lean();

        if (!wallet)
            return error(res, 404, 'Wallet not found');

        if (wallet.isFrozen)
            return error(res, 400, "Your wallet is not active")

        wallet.balance = (wallet.withdrawableBalance || 0) + (wallet.storeCreditBalance || 0);
        return success(res, 200, { wallet });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getWallet,
};
