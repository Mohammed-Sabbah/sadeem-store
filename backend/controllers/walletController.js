const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const walletService = require('../services/walletService');
const { success, error } = require('../utils/responses');
const { ROLE, WALLET_TRANSACTION_TYPE, TRANSACTION_STATUS } = require('../constants/enums');

async function getWallet(req, res, next) {
    try {
        const wallet = await Wallet.findOne({ userId: req.user._id }).lean();
        if (!wallet) {
            return error(res, 404, 'Wallet not found');
        }
        return success(res, 200, { wallet });
    } catch (err) {
        return next(err);
    }
}

async function getWalletTransactions(req, res, next) {
    try {
        const wallet = await Wallet.findOne({ userId: req.user._id }).lean();
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
        const transaction = await walletService.createDepositRequest({
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

async function listPendingDeposits(req, res, next) {
    try {
        const transactions = await WalletTransaction.find({
            type: WALLET_TRANSACTION_TYPE.DEPOSIT,
            status: TRANSACTION_STATUS.PENDING,
        }).sort({ createdAt: -1 }).lean();

        return success(res, 200, { transactions });
    } catch (err) {
        return next(err);
    }
}

async function getDeposit(req, res, next) {
    try {
        const transaction = await WalletTransaction.findById(req.params.id).lean();
        if (!transaction) {
            return error(res, 404, 'Deposit not found');
        }
        return success(res, 200, { transaction });
    } catch (err) {
        return next(err);
    }
}

async function approveDeposit(req, res, next) {
    try {
        const result = await walletService.approveDeposit({
            adminId: req.user._id,
            transactionId: req.params.id,
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

async function listPendingWithdrawals(req, res, next) {
    try {
        const transactions = await WalletTransaction.find({
            type: WALLET_TRANSACTION_TYPE.WITHDRAWAL,
            status: TRANSACTION_STATUS.PENDING,
        }).sort({ createdAt: -1 }).lean();

        return success(res, 200, { transactions });
    } catch (err) {
        return next(err);
    }
}

async function getWithdrawal(req, res, next) {
    try {
        const transaction = await WalletTransaction.findById(req.params.id).lean();
        if (!transaction) {
            return error(res, 404, 'Withdrawal not found');
        }
        return success(res, 200, { transaction });
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
    listPendingDeposits,
    getDeposit,
    approveDeposit,
    rejectDeposit,
    createWithdrawalRequest,
    listPendingWithdrawals,
    getWithdrawal,
    approveWithdrawal,
    completeWithdrawal,
    rejectWithdrawal,
    ROLE,
};
