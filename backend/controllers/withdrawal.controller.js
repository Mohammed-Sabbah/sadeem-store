const { success } = require("../utils/responses")

async function createWithdrawalRequest(req, res, next) {
    try {
        // const transaction = await walletService.createWithdrawalRequest({
        //     userId: req.user._id,
        //     amount: req.body.amount,
        //     payoutDetails: req.body.payoutDetails || {},
        //     idempotencyKey: req.get('Idempotency-Key'),
        // });

        return success(res, 201, {
            message: 'Withdrawal request created successfully',
            // transaction,
        });
    } catch (err) {
        return next(err);
    }
}

async function approveWithdrawal(req, res, next) {
    try {
        // const transaction = await walletService.approveWithdrawal({
        //     adminId: req.user._id,
        //     transactionId: req.params.id,
        //     payoutReference: req.body.payoutReference,
        //     idempotencyKey: req.get('Idempotency-Key'),
        // });

        return success(res, 200, {
            message: 'Withdrawal approved successfully',
            // transaction,
        });
    } catch (err) {
        return next(err);
    }
}

async function rejectWithdrawal(req, res, next) {
    try {
        // const transaction = await walletService.rejectWithdrawal({
        //     adminId: req.user._id,
        //     transactionId: req.params.id,
        //     rejectReason: req.body.rejectReason,
        //     idempotencyKey: req.get('Idempotency-Key'),
        // });

        return success(res, 200, {
            message: 'Withdrawal rejected successfully',
            // transaction,
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    createWithdrawalRequest,
    approveWithdrawal,
    rejectWithdrawal
}