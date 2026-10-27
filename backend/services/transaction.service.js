const { TRANSACTION_STATUS } = require("../constants/enums")
const walletTransaction = require("../models/WalletTransaction")

const createTransaction = async (transactionData) => {
    return await walletTransaction.create(transactionData)
}

const updateTransaction = async ({ transactionId, updates }, session) => {
    const updatedTransaction = await walletTransaction.findOneAndUpdate(
        {
            _id: transactionId,
            status: TRANSACTION_STATUS.PENDING
        },
        updates
        ,
        { session, new: true })

    if (!updatedTransaction)
        return error("Transaction Not Found", 404)

    return updatedTransaction
}

module.exports = {
    createTransaction,
    updateTransaction
}