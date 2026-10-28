const { success } = require("../utils/responses")
const { createDeposit, approveDeposit, rejectDeposit } = require("../services/deposit.service")

async function createDepositRequest(req, res, next) {
    try {
        const deposit = await createDeposit({
            userId: req.user._id,
            amount: req.body.amount,
            proofImage: req.body.proofImage,
        })
        return success(res, 201, {
            message: 'Deposit request created successfully',
            deposit,
        });
    } catch (err) {
        return next(err);
    }
}

async function approveDepositRequest(req, res, next) {
    try {
        const transaction = await approveDeposit({
            transactionId: req.params.id,
            amount: req.body.amount,
            verifiedBy: req.user._id,
        })
        return success(res, 200, {
            message: 'Deposit approved successfully',
            transaction,
        });
    } catch (err) {
        return next(err);
    }
}

async function rejectDepositRequest(req, res, next) {
    try {
        const transaction = await rejectDeposit({
            transactionId: req.params.id,
            verifiedBy: req.user._id,
            rejectReason: req.body.rejectReason
        })
        return success(res, 200, {
            message: 'Deposit rejected successfully',
            transaction,
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    createDepositRequest,
    approveDepositRequest,
    rejectDepositRequest
}