const mongoose = require("mongoose");
const Wallet = require("../models/Wallet")
const WalletTransaction = require("../models/WalletTransaction");
const { createTransaction, updateTransaction } = require("./transaction.service");
const { parsePositiveMoney } = require("../utils/wallet");
const { decreaseWalletBalance, increaseWalletBalance } = require("./walletService");
const { WALLET_TRANSACTION_TYPE, TRANSACTION_STATUS, BALANCE_TYPE } = require("../constants/enums")
const error = require("../utils/error");

const createWithdrawal = async ({ userId, amount, payoutDetails }) => {
    const session = await mongoose.startSession()
    try {
        const pureAmount = parsePositiveMoney(amount)
        let withdrawalTransaction;
        await session.withTransaction(async () => {
            const wallet = await Wallet.findOne({
                userId,
                isFrozen: false,
                withdrawableBalance: { $gte: pureAmount }
            }).session(session)
            if (!wallet) throw error("wallet not found or not enough balance")

            // decrese the wallet 
            await decreaseWalletBalance({
                userId,
                walletId: wallet._id,
                withdrawableBalance: pureAmount,
            }, session)

            // create the transaction
            const transaction = await createTransaction({
                walletId: wallet._id,
                userId,
                amount: pureAmount,
                type: WALLET_TRANSACTION_TYPE.WITHDRAWAL,
                status: TRANSACTION_STATUS.PENDING,
                balanceType: BALANCE_TYPE.WITHDRAWABLE,
                payoutDetails,
                createdBy: userId
            }, session)
            withdrawalTransaction = transaction
        })
        return withdrawalTransaction
    } finally {
        session.endSession()
    }
}

const approveWithdrawal = async ({ transactionId, adminId }) => {
    const query = {
        status: TRANSACTION_STATUS.PENDING
    }
    const updates = {
        status: TRANSACTION_STATUS.APPROVED,
        verifiedBy: adminId,
        reviewedAt: new Date()
    }
    const transaction = await updateTransaction({
        transactionId,
        query,
        updates
    })
    if (!transaction) throw error("Transaction not found")
    return transaction
}

const rejectWithdrawal = async ({ transactionId, adminId, rejectReason }) => {
    const session = await mongoose.startSession()
    try {
        let rejectedWithdrawal;
        await session.withTransaction(async () => {
            const transaction = await WalletTransaction.findOne({
                _id: transactionId,
                status: TRANSACTION_STATUS.PENDING
            }).session(session)
            if (!transaction) throw error("Transaction not found")

            // refund the wallet balance
            await increaseWalletBalance({
                userId: transaction.userId,
                walletId: transaction.walletId,
                withdrawableBalance: transaction.amount
            }, session)

            // update the transaction
            const query = {
                status: TRANSACTION_STATUS.PENDING
            }
            const updates = {
                status: TRANSACTION_STATUS.REJECTED,
                verifiedBy: adminId,
                reviewedAt: new Date(),
                rejectReason
            }
            const updatedTransaction = await updateTransaction({
                transactionId: transaction._id,
                query,
                updates
            }, session)
            rejectedWithdrawal = updatedTransaction
        })
        return rejectedWithdrawal
    } finally {
        session.endSession()
    }
}

module.exports = {
    createWithdrawal,
    approveWithdrawal,
    rejectWithdrawal
}