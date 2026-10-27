const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const walletService = require('../services/walletService');
const { success, error } = require('../utils/responses');
const { ROLE } = require('../constants/enums');

const getWalletFilter = (req) => ({
    isFrozen: false,
    userId: req.user._id,
})

async function getWallet(req, res, next) {
    try {
        const wallet = await Wallet.findOne({ userId: req.user._id }).lean();

        if (!wallet)
            return error(res, 404, 'Wallet not found');

        if (wallet.isFrozen)
            return error(res, 400, "Your wallet is not active")

        return success(res, 200, { wallet });
    } catch (err) {
        return next(err);
    }
}

async function getWalletTransactions(req, res, next) {
    try {
        const wallet = await Wallet.findOne(getWalletFilter(req)).lean();
        if (!wallet) {
            return error(res, 404, 'Wallet not found');
        }

        const result = await walletService.getWalletTransactions(wallet._id, req.query, {
            offset: Number(req.query.offset || 0),
            limit: Number(req.query.limit || 20),
        });

        return success(res, 200, result);
    } catch (err) {
        return next(err);
    }
}

async function getWalletTransaction(req, res, next) {
    try {
        const query = {
            _id: req.params.id,
            isDeleted: { $ne: true },
        };
        if (req.user.role !== ROLE.ADMIN) {
            query.userId = req.user._id;
        }

        const transaction = await WalletTransaction.findOne(query)
            .populate('userId', 'name phoneNumber email')
            .lean();
        if (!transaction) {
            return error(res, 404, 'Transaction not found');
        }
        return success(res, 200, { transaction });
    } catch (err) {
        return next(err);
    }
}

async function listTransactions(req, res, next) {
    try {
        const result = await walletService.getAllWalletTransactions(req.query, {
            offset: Number(req.query.offset || 0),
            limit: Number(req.query.limit || 20),
        });
        return success(res, 200, result);
    } catch (err) {
        return next(err);
    }
}

async function cancelTransaction(req, res, next) {
    try {
        const transaction = await walletService.cancelWalletTransaction({
            userId: req.user._id,
            transactionId: req.params.id,
            idempotencyKey: req.get('Idempotency-Key'),
        });

        return success(res, 200, {
            message: 'Transaction cancelled successfully',
            transaction,
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getWallet,
    getWalletTransactions,
    listTransactions,
    getWalletTransaction,
    cancelTransaction,
};
