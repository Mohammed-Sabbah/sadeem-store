const crypto = require('crypto');
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

// Deposits
async function createDepositRequest(req, res, next) {
    try {
        const transaction = await walletService.createDepositRequest({
            userId: req.user._id,
            amount: req.body.amount,
            proofImage: req.body.proofImage,
            idempotencyKey: req.get('Idempotency-Key'),
            idempotencyPayload: {
                amount: Number(req.body.amount),
                proofImage: req.file
                    ? crypto.createHash('sha256').update(req.file.buffer).digest('hex')
                    : String(req.body.proofImage || '').trim(),
            },
        });

        return success(res, 201, {
            message: 'Deposit request created successfully',
            transaction,
        });
    } catch (err) {
        return next(err);
    }
}

async function approveDeposit(req, res, next) {
    try {
        const result = await walletService.approveDeposit({
            adminId: req.user._id,
            transactionId: req.params.id,
            amount: req.body.amount,
            proofReviewed: req.body.proofReviewed,
            idempotencyKey: req.get('Idempotency-Key'),
        });
        return success(res, 200, {
            message: 'Deposit approved successfully',
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
            idempotencyKey: req.get('Idempotency-Key'),
        });

        return success(res, 200, {
            message: 'Deposit rejected successfully',
            transaction,
        });
    } catch (err) {
        return next(err);
    }
}

// Withdrawals
async function createWithdrawalRequest(req, res, next) {
    try {
        const transaction = await walletService.createWithdrawalRequest({
            userId: req.user._id,
            amount: req.body.amount,
            payoutDetails: req.body.payoutDetails || {},
            idempotencyKey: req.get('Idempotency-Key'),
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
            payoutReference: req.body.payoutReference,
            idempotencyKey: req.get('Idempotency-Key'),
        });

        return success(res, 200, {
            message: 'Withdrawal approved successfully',
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
            idempotencyKey: req.get('Idempotency-Key'),
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
    approveDeposit,
    rejectDeposit,
    createWithdrawalRequest,
    approveWithdrawal,
    rejectWithdrawal,
};
