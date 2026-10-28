const { WALLET_TRANSACTION_TYPE, TRANSACTION_STATUS, BALANCE_TYPE } = require("../constants/enums")
const Wallet = require("../models/Wallet")
const { parsePositiveMoney } = require("../utils/wallet")
const error = require("../utils/error")
const WalletTransaction = require("../models/WalletTransaction")
const mongoose = require("mongoose")
const { createTransaction, updateTransaction } = require("./transaction.service")
const { increaseWalletBalance } = require("../services/walletService")

const createDeposit = async ({ userId, amount, proofImage }) => {
    const wallet = await Wallet.findOne({ userId, isFrozen: false })
    if (!wallet) throw error("Wallet Not Found", 404)

    const pureAmount = parsePositiveMoney(amount)
    return await createTransaction({
        userId: wallet.userId,
        walletId: wallet._id,
        amount: pureAmount,
        type: WALLET_TRANSACTION_TYPE.DEPOSIT,
        status: TRANSACTION_STATUS.PENDING,
        balanceType: BALANCE_TYPE.WITHDRAWABLE,
        proofImage,
        createdBy: userId
    })
}

const approveDeposit = async ({ transactionId, amount, verifiedBy }) => {
    const session = await mongoose.startSession()
    try {
        let approvedDeposit;
        await session.withTransaction(async () => {
            // Find Transaction
            const deposit = await WalletTransaction.findOne({
                _id: transactionId,
                status: TRANSACTION_STATUS.PENDING
            }).session(session);
            if (!deposit) throw error("Deposit Transaction not found", 404)

            // Increase Wallet Balance
            const depositAmount = amount ?? deposit.amount
            await increaseWalletBalance({
                userId: deposit.userId,
                walletId: deposit.walletId,
                withdrawableBalance: depositAmount
            }, session)

            // Update Transaction
            const transactionUpdates = {
                status: TRANSACTION_STATUS.APPROVED,
                verifiedBy
            }
            const updatedDeposit = await updateTransaction({
                transactionId: deposit._id,
                updates: transactionUpdates,
            }, session)
            approvedDeposit = updatedDeposit
        })
        return approvedDeposit
    }
    finally {
        session.endSession()
    }

}

const rejectDeposit = async ({ transactionId, verifiedBy, rejectReason }) => {
    const session = await mongoose.startSession()
    try {
        let rejectedDeposit;
        await session.withTransaction(async () => {
            // Find Transaction
            const deposit = await WalletTransaction.findOne({
                _id: transactionId,
                status: TRANSACTION_STATUS.PENDING
            }).session(session)
            if (!deposit)
                throw error("Deposit Transaction not found", 404)

            // Update Transaction
            const transactionUpdates = {
                status: TRANSACTION_STATUS.REJECTED,
                verifiedBy,
                rejectReason
            }
            const updatedDeposit = await updateTransaction({
                transactionId: deposit._id,
                updates: transactionUpdates,
            }, session)
            rejectedDeposit = updatedDeposit
        })
        return rejectedDeposit
    }
    finally {
        session.endSession()
    }
}

module.exports = {
    createDeposit,
    approveDeposit,
    rejectDeposit
}