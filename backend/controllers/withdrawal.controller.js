const { createWithdrawal, approveWithdrawal, rejectWithdrawal } = require("../services/withdrawal.service");
const { success } = require("../utils/responses")

async function createWithdrawalRequest(req, res, next) {
    try {
        const transaction = await createWithdrawal({
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

async function approveWithdrawalRequest(req, res, next) {
    try {
        const transaction = await approveWithdrawal({
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

async function rejectWithdrawalRequest(req, res, next) {
    try {
        const transaction = await rejectWithdrawal({
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
    createWithdrawalRequest,
    approveWithdrawalRequest,
    rejectWithdrawalRequest
}