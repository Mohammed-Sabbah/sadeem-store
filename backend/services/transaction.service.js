const { TRANSACTION_STATUS } = require("../constants/enums")
const walletTransaction = require("../models/WalletTransaction")
const error = require("../utils/error")
const { roundMoney } = require("../utils/wallet")

const normalizeMoneyFields = (values) => {
    const normalized = { ...values };

    if (normalized.amount !== undefined && normalized.amount !== null) {
        normalized.amount = roundMoney(normalized.amount);
    }

    if (normalized.allocations) {
        normalized.allocations = { ...normalized.allocations };
        for (const field of ["storeCreditBalance", "withdrawableBalance"]) {
            const amount = normalized.allocations[field];
            if (amount !== undefined && amount !== null) {
                normalized.allocations[field] = roundMoney(amount);
            }
        }
    }

    return normalized;
};

const createTransaction = async (transactionData, session = null) => {
    const [transaction] = await walletTransaction.create(
        [normalizeMoneyFields(transactionData)],
        session ? { session } : {}
    );

    return transaction;
};

const updateTransaction = async ({ transactionId, updates, query = {} }, session) => {
    const updatedTransaction = await walletTransaction.findOneAndUpdate(
        {
            _id: transactionId,
            ...query
        },
        normalizeMoneyFields(updates),
        { session, new: true })

    if (!updatedTransaction)
        throw error("Transaction Not Found", 404)

    return updatedTransaction
}

module.exports = {
    createTransaction,
    updateTransaction
}