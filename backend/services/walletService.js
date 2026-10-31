const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const { updateTransaction, createTransaction } = require("./transaction.service")
const {
    parsePositiveMoney,
} = require("../utils/wallet")
const error = require("../utils/error")
const {
    WALLET_TRANSACTION_TYPE,
    TRANSACTION_STATUS,
} = require('../constants/enums');

// Helpers
function buildTransactionQuery(filters = {}, walletId = null) {
    const query = { isDeleted: { $ne: true } };
    if (walletId) {
        query.walletId = walletId;
    }

    ['type', 'status', 'balanceType', 'userId'].forEach((field) => {
        if (filters[field]) query[field] = filters[field];
    });
    if (!walletId && filters.walletId) query.walletId = filters.walletId;

    if (filters.createdFrom || filters.createdTo) {
        query.createdAt = {};
        if (filters.createdFrom) {
            query.createdAt.$gte = new Date(filters.createdFrom);
        }
        if (filters.createdTo) {
            query.createdAt.$lte = new Date(filters.createdTo);
        }
    }

    return query;
}

async function findWalletTransactions(query, pagination = {}, populateUser = false) {
    const offset = Number(pagination.offset || 0);
    const limit = Number(pagination.limit || 20);

    let transactionsQuery = WalletTransaction.find(query).sort({ createdAt: -1 });
    if (populateUser) {
        transactionsQuery = transactionsQuery.populate('userId', 'name phoneNumber email');
    }
    const [transactions, total] = await Promise.all([
        transactionsQuery.skip(offset).limit(limit).lean(),
        WalletTransaction.countDocuments(query),
    ]);

    return {
        transactions,
        total,
        page: Math.max(1, Math.floor(offset / limit) + 1),
        limit,
    };
}

const getSpendableBalance = async (wallet) => {
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
// List Transactions
async function getWalletByUserId(userId) {
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
        throw new Error('Invalid user id');
    }

    return Wallet.findOne({ userId }).lean();
}

async function getWalletTransactions(walletId, filters = {}, pagination = {}) {
    if (!walletId || !mongoose.Types.ObjectId.isValid(String(walletId))) {
        throw new Error('Invalid wallet id');
    }

    return findWalletTransactions(buildTransactionQuery(filters, walletId), pagination);
}

async function getAllWalletTransactions(filters = {}, pagination = {}) {
    return findWalletTransactions(buildTransactionQuery(filters), pagination, true);
}

async function cancelWalletTransaction({ userId, transactionId }) {
    const session = await mongoose.startSession()
    try {
        let cancelledTransaction;
        await session.withTransaction(async () => {
            const transaction = await WalletTransaction.findOne({
                _id: transactionId,
                userId,
                status: TRANSACTION_STATUS.PENDING
            }).session(session)
            if (!transaction) throw error("Transaction Not Found")

            if (transaction.type === WALLET_TRANSACTION_TYPE.WITHDRAWAL) {
                // increase Wallet Balance
                await increaseWalletBalance({
                    userId,
                    walletId: transaction.walletId,
                    withdrawableBalance: transaction.amount,
                }, session)
            }

            // update wallet
            const query = {
                status: TRANSACTION_STATUS.PENDING
            }
            const updates = {
                status: TRANSACTION_STATUS.CANCELLED
            }
            const updatedTransaction = await updateTransaction({
                transactionId,
                query,
                updates
            }, session)
            cancelledTransaction = updatedTransaction
        })
        return cancelledTransaction
    } finally {
        session.endSession()
    }
}

const increaseWalletBalance = async ({ userId, walletId, withdrawableBalance = 0, storeCreditBalance = 0 }, session) => {
    const withdrawableBalanceAmount = parsePositiveMoney(withdrawableBalance)
    const storeCreditBalanceAmount = parsePositiveMoney(storeCreditBalance)

    const updatedWallet = await Wallet.updateOne(
        {
            _id: walletId,
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

const decreaseWalletBalance = async ({ userId, walletId, withdrawableBalance = 0, storeCreditBalance = 0 }, session) => {
    const withdrawableBalanceAmount = parsePositiveMoney(withdrawableBalance)
    const storeCreditBalanceAmount = parsePositiveMoney(storeCreditBalance)
    const updatedWallet = await Wallet.updateOne(
        {
            _id: walletId,
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

const payForOrder = async ({ amount, userId, orderId }, session) => {
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
        walletId: wallet._id,
        withdrawableBalance: allocations.withdrawableDeduction,
        storeCreditBalance: allocations.storeCreditDeduction
    }, session)

    // create trasnaction record
    await createTransaction({
        userId,
        walletId: wallet._id,
        amount: pureAmount,
        status: TRANSACTION_STATUS.APPROVED,
        type: WALLET_TRANSACTION_TYPE.PURCHASE,
        referenceId: orderId,
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

const refundOrder = async ({ orderId, userId }, session) => {
    if (!session)
        throw error("A session is required for wallet payment");

    const transaction = await WalletTransaction.findOne({
        referenceId: orderId,
        userId,
        status: TRANSACTION_STATUS.APPROVED,
        type: WALLET_TRANSACTION_TYPE.PURCHASE
    }).session(session)
    if (!transaction)
        throw error("Transaction not found")

    const allocations = transaction.allocations
    const walletId = transaction.walletId

    // update original transaction
    const query = {
        userId,
        status: TRANSACTION_STATUS.APPROVED,
        type: WALLET_TRANSACTION_TYPE.PURCHASE
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
        walletId,
        storeCreditBalance: allocations.storeCreditBalance,
        withdrawableBalance: allocations.withdrawableBalance
    }, session)

    // create refund transaction
    await createTransaction({
        userId,
        walletId,
        status: TRANSACTION_STATUS.APPROVED,
        type: WALLET_TRANSACTION_TYPE.REFUND,
        allocations,
        amount: transaction.amount,
        referenceId: orderId
    }, session)

}

module.exports = {
    getWalletByUserId,
    getWalletTransactions,
    getAllWalletTransactions,
    cancelWalletTransaction,
    increaseWalletBalance,
    decreaseWalletBalance,
    payForOrder,
    refundOrder
};
