const { TRANSACTION_STATUS } = require("../constants/enums")
const walletTransaction = require("../models/WalletTransaction")
const error = require("../utils/error")

const createTransaction = async (transactionData, session = null) => {
    const [transaction] = await walletTransaction.create(
        [transactionData],
        session ? { session } : {}
    );

    return transaction;
};

const updateTransaction = async ({ transactionId, updates }, session) => {
    const updatedTransaction = await walletTransaction.findOneAndUpdate(
        {
            _id: transactionId,
            status: TRANSACTION_STATUS.PENDING
        },
        updates,
        { session, new: true })

    if (!updatedTransaction)
        throw error("Transaction Not Found", 404)

    return updatedTransaction
}

module.exports = {
    createTransaction,
    updateTransaction
}