const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const { updateTransaction } = require("./transaction.service")
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
            const updates = {
                status: TRANSACTION_STATUS.CANCELLED
            }
            const updatedTransaction = await updateTransaction({
                transactionId,
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
    const wallet = await Wallet.findOne({ _id: walletId, userId, isFrozen: false }).session(session)
    if (!wallet) throw error("Wallet Not Found", 404)

    const updatedWallet = await Wallet.updateOne(
        { _id: walletId, isFrozen: false },
        {
            $inc: {
                withdrawableBalance: +withdrawableBalanceAmount,
                storeCreditBalance: +storeCreditBalanceAmount
            }
        },
        { session, new: true }
    )

    if (updatedWallet.modifiedCount !== 1)
        throw error("Cant update this wallet")

    return { updatedWallet }
}

const decreaseWalletBalance = async ({ userId, walletId, withdrawableBalance = 0, storeCreditBalance = 0 }, session) => {
    const withdrawableBalanceAmount = parsePositiveMoney(withdrawableBalance)
    const storeCreditBalanceAmount = parsePositiveMoney(storeCreditBalance)

    const wallet = await Wallet.findOne({ _id: walletId, userId, isFrozen: false }).session(session)
    if (!wallet) throw error("Wallet Not Found", 404)

    const updatedWallet = await Wallet.updateOne(
        {
            _id: walletId,
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
    )

    if (updatedWallet.modifiedCount !== 1)
        throw error("Cant Update this wallet")

    return { updatedWallet }
}

module.exports = {
    getWalletByUserId,
    getWalletTransactions,
    getAllWalletTransactions,
    cancelWalletTransaction,
    increaseWalletBalance,
    decreaseWalletBalance
};
