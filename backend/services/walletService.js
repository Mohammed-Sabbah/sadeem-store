const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/Transaction.model');
const { updateTransaction, createTransaction } = require("./transaction.service")
const {
    parsePositiveMoney,
    roundMoney,
} = require("../utils/wallet")
const error = require("../utils/error")
const {
    TRANSACTION_TYPE,
    TRANSACTION_STATUS,
} = require('../constants/enums');

// Helpers
const getSpendableBalance = (wallet) => {
    return wallet.storeCreditBalance + wallet.withdrawableBalance
}

const calculateWalletBalanceDeduction = (wallet, amount) => {
    const storeCreditDeduction = Math.min(
        amount,
        wallet.storeCreditBalance
    );
    const withdrawableDeduction = amount - storeCreditDeduction;

    return {
        storeCreditDeduction,
        withdrawableDeduction
    };
}

const calculateRefundAllocations = (amount, allocations) => {
    const withdrawableRefund = roundMoney(Math.min(
        amount,
        allocations.withdrawableBalance
    ));

    const storeCreditRefund = roundMoney(amount - withdrawableRefund);

    if (storeCreditRefund > allocations.storeCreditBalance) {
        throw error("Refund amount exceeds remaining allocations");
    }

    return {
        refundAllocations: {
            storeCreditBalance: storeCreditRefund,
            withdrawableBalance: withdrawableRefund
        },
        remainingAllocations: {
            storeCreditBalance: roundMoney(allocations.storeCreditBalance - storeCreditRefund),
            withdrawableBalance: roundMoney(allocations.withdrawableBalance - withdrawableRefund)
        }
    };
};

// User Wallet
async function getWalletByUserId(userId) {
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
        throw new Error('Invalid user id');
    }

    return Wallet.findOne({ userId }).lean();
}

const increaseWalletBalance = async ({ userId, withdrawableBalance = 0, storeCreditBalance = 0 }, session) => {
    const withdrawableBalanceAmount = parsePositiveMoney(withdrawableBalance)
    const storeCreditBalanceAmount = parsePositiveMoney(storeCreditBalance)

    const updatedWallet = await Wallet.updateOne(
        {
            userId,
            isFrozen: false
        },
        {
            $inc: {
                withdrawableBalance: withdrawableBalanceAmount,
                storeCreditBalance: storeCreditBalanceAmount
            }
        },
        { session }
    )

    if (updatedWallet.matchedCount === 0) throw error("Wallet Not Found", 404)

    return { updatedWallet }
}

const decreaseWalletBalance = async ({ userId, withdrawableBalance = 0, storeCreditBalance = 0 }, session) => {
    const withdrawableBalanceAmount = parsePositiveMoney(withdrawableBalance)
    const storeCreditBalanceAmount = parsePositiveMoney(storeCreditBalance)
    const updatedWallet = await Wallet.updateOne(
        {
            userId,
            isFrozen: false,
            withdrawableBalance: { $gte: withdrawableBalanceAmount },
            storeCreditBalance: { $gte: storeCreditBalanceAmount }
        },
        {
            $inc: {
                withdrawableBalance: -withdrawableBalanceAmount,
                storeCreditBalance: -storeCreditBalanceAmount
            }
        },
        { session }
    );

    if (updatedWallet.matchedCount === 0)
        throw error(
            "Wallet not found, frozen, or insufficient balance",
            400
        );

    return { updatedWallet }
}

const payForOrder = async ({ amount, userId, orderGroupId }, session) => {
    if (!session)
        throw error("A session is required for wallet payment");

    const pureAmount = parsePositiveMoney(amount)
    const wallet = await Wallet.findOne({ userId, isFrozen: false }).session(session)
    if (!wallet)
        throw error("Wallet Not Found")

    const walletBalance = getSpendableBalance(wallet)
    if (pureAmount > walletBalance)
        throw error("You dont have enough balance")

    // decrease wallet
    const allocations = calculateWalletBalanceDeduction(wallet, pureAmount)
    await decreaseWalletBalance({
        userId,
        withdrawableBalance: allocations.withdrawableDeduction,
        storeCreditBalance: allocations.storeCreditDeduction
    }, session)

    // create trasnaction record
    await createTransaction({
        userId,
        walletId: wallet._id,
        amount: pureAmount,
        status: TRANSACTION_STATUS.APPROVED,
        type: TRANSACTION_TYPE.PURCHASE,
        referenceId: orderGroupId,
        allocations: {
            storeCreditBalance: allocations.storeCreditDeduction,
            withdrawableBalance: allocations.withdrawableDeduction
        },
    }, session)

    return {
        amount: pureAmount,
        allocations: {
            storeCreditBalance: allocations.storeCreditDeduction,
            withdrawableBalance: allocations.withdrawableDeduction
        }
    };
}

const refundOrder = async ({ orderGroupId, userId }, session) => {
    if (!session)
        throw error("A session is required for wallet payment");

    const transactionStatusFilter = { $in: [TRANSACTION_STATUS.APPROVED, TRANSACTION_STATUS.PARTIALLY_REFUND] }

    const transaction = await WalletTransaction.findOne({
        referenceId: orderGroupId,
        userId,
        status: transactionStatusFilter,
        type: TRANSACTION_TYPE.PURCHASE
    }).session(session)
    if (!transaction)
        throw error("Transaction not found")

    const allocations = transaction.allocations
    const walletId = transaction.walletId

    // update original transaction
    const query = {
        userId,
        status: transactionStatusFilter,
        type: TRANSACTION_TYPE.PURCHASE
    }
    const updates = {
        status: TRANSACTION_STATUS.REFUNDED
    }
    await updateTransaction({
        transactionId: transaction._id,
        query,
        updates
    }, session)

    // increase wallet balance
    await increaseWalletBalance({
        userId,
        storeCreditBalance: allocations.storeCreditBalance,
        withdrawableBalance: allocations.withdrawableBalance
    }, session)

    // create refund transaction
    await createTransaction({
        userId,
        walletId,
        status: TRANSACTION_STATUS.APPROVED,
        type: TRANSACTION_TYPE.REFUND,
        allocations,
        amount: transaction.amount,
        referenceId: orderGroupId
    }, session)
}

const refundOrderItemsCancellation = async ({ orderGroupId, userId, amount }, session) => {
    if (!session)
        throw error("A session is required for wallet payment");

    const refundAmount = parsePositiveMoney(amount, "Refund amount");
    const wallet = await Wallet.findOne({ userId, isFrozen: false }).session(session)
    if (!wallet) throw error("Wallet not found")

    const transactionStatusFilter = { $in: [TRANSACTION_STATUS.APPROVED, TRANSACTION_STATUS.PARTIALLY_REFUND] }

    const transaction = await WalletTransaction.findOne({
        referenceId: orderGroupId,
        userId,
        status: transactionStatusFilter,
        type: TRANSACTION_TYPE.PURCHASE
    }).session(session)

    if (!transaction)
        throw error("Transaction not found")

    const allocations = transaction.allocations
    const { refundAllocations, remainingAllocations } = calculateRefundAllocations(refundAmount, allocations)

    // increase wallet
    await increaseWalletBalance({
        userId,
        withdrawableBalance: refundAllocations.withdrawableBalance,
        storeCreditBalance: refundAllocations.storeCreditBalance
    }, session)

    // update original transaction
    const remainingAmount = roundMoney(transaction.amount - refundAmount);

    const newStatus = remainingAmount === 0
        ? TRANSACTION_STATUS.REFUNDED
        : TRANSACTION_STATUS.PARTIALLY_REFUND;

    const query = {
        status: transactionStatusFilter,
        type: TRANSACTION_TYPE.PURCHASE,
        userId
    }
    const updates = {
        allocations: remainingAllocations,
        amount: remainingAmount,
        status: newStatus
    }
    await updateTransaction({
        transactionId: transaction._id,
        query,
        updates
    }, session)

    // create Transaction
    await createTransaction({
        userId,
        walletId: wallet._id,
        status: TRANSACTION_STATUS.APPROVED,
        type: TRANSACTION_TYPE.REFUND,
        allocations: refundAllocations,
        amount: refundAmount,
        referenceId: orderGroupId
    }, session)
}

module.exports = {
    getWalletByUserId,
    increaseWalletBalance,
    decreaseWalletBalance,
    payForOrder,
    refundOrder,
    refundOrderItemsCancellation
};
