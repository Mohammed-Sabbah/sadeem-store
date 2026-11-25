const Transaction = require("../models/Transaction.model");
const transactionService = require("../services/transaction.service")
const { success } = require("../utils/responses")

async function getTransactions(req, res, next) {
    try {
        const result = await transactionService.getTransactions(req.user._id, req.query, {
            offset: Number(req.query.offset || 0),
            limit: Number(req.query.limit || 20),
        });

        return success(res, 200, result);
    } catch (err) {
        return next(err);
    }
}

async function getTransaction(req, res, next) {
    try {
        const query = {
            _id: req.params.id,
            isDeleted: { $ne: true },
        };
        if (req.user.role !== ROLE.ADMIN) {
            query.userId = req.user._id;
        }

        const transaction = await Transaction.findOne(query)
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
        const result = await transactionService.getAllTransactions(req.query, {
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
        const transaction = await transactionService.cancelTransaction({
            userId: req.user._id,
            transactionId: req.params.id,
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
    getTransactions,
    getTransaction,
    listTransactions,
    cancelTransaction
}