const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const walletService = require('../services/walletService');
const { success, error } = require('../utils/responses');
const { TRANSACTION_STATUS } = require('../constants/enums');

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

async function createDepositRequest(req, res, next) {
    try {
        const wallet = await Wallet.findOne(getWalletFilter(req)).lean()
        if (!wallet) return error(res, 404, "Wallet not found")

        const transaction = await walletService.createDepositRequest({
            walletId: wallet._id,
            userId: req.user._id,
            amount: req.body.amount,
            proofImage: req.body.proofImage,
            referenceId: req.body.referenceId,
            description: req.body.description,
        });

        return success(res, 201, {
            message: 'Deposit request created successfully',
            transaction,
        });
    } catch (err) {
        return next(err);
    }
}

async function listTransactions(req, res, next) {
    try {
        const { type, status, balanceType, createdFrom, createdTo, userId, walletId } = req.query;
        const offset = Number(req.query.offset || 0);
        const limit = Number(req.query.limit || 20);
        const query = { isDeleted: { $ne: true } };

        if (type) query.type = type;
        if (status) query.status = status;
        if (balanceType) query.balanceType = balanceType;
        if (userId) query.userId = userId;
        if (walletId) query.walletId = walletId;
        if (createdFrom || createdTo) {
            query.createdAt = {};
            if (createdFrom) query.createdAt.$gte = new Date(createdFrom);
            if (createdTo) query.createdAt.$lte = new Date(createdTo);
        }

        const [transactions, total] = await Promise.all([
            WalletTransaction.find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            WalletTransaction.countDocuments(query),
        ]);

        return success(res, 200, {
            transactions,
            total,
            page: Math.max(1, Math.floor(offset / limit) + 1),
            limit,
        });
    } catch (err) {
        return next(err);
    }
}

async function getWalletTransaction(req, res, next) {
    try {
        const transaction = await WalletTransaction.findOne({
            _id: req.params.id,
            isDeleted: { $ne: true },
        }).lean();
        if (!transaction) {
            return error(res, 404, 'Transaction not found');
        }
        return success(res, 200, { transaction });
    } catch (err) {
        return next(err);
    }
}

async function cancelTransaction(req, res, next) {
    try {
        const transaction = await WalletTransaction.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user._id,
                status: TRANSACTION_STATUS.PENDING,
                isDeleted: { $ne: true },
            },
            { $set: { status: TRANSACTION_STATUS.CANCELLED } },
            { new: true }
        ).lean();

        if (!transaction) {
            const existingTransaction = await WalletTransaction.findOne({
                _id: req.params.id,
                userId: req.user._id,
                isDeleted: { $ne: true },
            }).select('status').lean();

            if (!existingTransaction) {
                return error(res, 404, 'Transaction not found');
            }

            return error(res, 400, 'Only pending transactions can be cancelled');
        }

        return success(res, 200, {
            message: 'Transaction cancelled successfully',
            transaction,
        });
    } catch (err) {
        return next(err);
    }
}

async function completeDeposit(req, res, next) {
    try {
        const result = await walletService.completeDeposit({
            adminId: req.user._id,
            transactionId: req.params.id,
        });
        return success(res, 200, {
            message: 'Deposit completed successfully',
            ...result,
        });
    } catch (err) {
        return next(err);
    }
}

async function rejectDeposit(req, res, next) {
    try {
        const transaction = await walletService.rejectDeposit({
            adminId: req.user._id,
            transactionId: req.params.id,
            rejectReason: req.body.rejectReason,
        });

        return success(res, 200, {
            message: 'Deposit rejected successfully',
            transaction,
        });
    } catch (err) {
        return next(err);
    }
}

async function createWithdrawalRequest(req, res, next) {
    try {
        const transaction = await walletService.createWithdrawalRequest({
            userId: req.user._id,
            amount: req.body.amount,
            payoutDetails: req.body.payoutDetails || {},
        });

        return success(res, 201, {
            message: 'Withdrawal request created successfully',
            transaction,
        });
    } catch (err) {
        return next(err);
    }
}

async function approveWithdrawal(req, res, next) {
    try {
        const transaction = await walletService.approveWithdrawal({
            adminId: req.user._id,
            transactionId: req.params.id,
        });

        return success(res, 200, {
            message: 'Withdrawal approved successfully',
            transaction,
        });
    } catch (err) {
        return next(err);
    }
}

async function completeWithdrawal(req, res, next) {
    try {
        const transaction = await walletService.completeWithdrawal({
            adminId: req.user._id,
            transactionId: req.params.id,
            payoutReference: req.body.payoutReference,
        });

        return success(res, 200, {
            message: 'Withdrawal completed successfully',
            transaction,
        });
    } catch (err) {
        return next(err);
    }
}

async function rejectWithdrawal(req, res, next) {
    try {
        const transaction = await walletService.rejectWithdrawal({
            adminId: req.user._id,
            transactionId: req.params.id,
            rejectReason: req.body.rejectReason,
        });

        return success(res, 200, {
            message: 'Withdrawal rejected successfully',
            transaction,
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getWallet,
    getWalletTransactions,
    createDepositRequest,
    listTransactions,
    getWalletTransaction,
    cancelTransaction,
    completeDeposit,
    rejectDeposit,
    createWithdrawalRequest,
    approveWithdrawal,
    completeWithdrawal,
    rejectWithdrawal,
};
