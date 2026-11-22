const { TRANSACTION_STATUS } = require("../constants/enums")
const Transaction = require("../models/Transaction.model")
const Wallet = require("../models/Wallet")
const error = require("../utils/error")
const { roundMoney } = require("../utils/wallet")

// Helpers
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

function buildTransactionQuery(filters = {}) {
    const query = { isDeleted: { $ne: true } };

    ['type', 'status', 'balanceType', 'userId'].forEach((field) => {
        if (filters[field]) query[field] = filters[field];
    });

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

async function listTransactions(query, pagination = {}, populateUser = false) {
    const offset = Number(pagination.offset || 0);
    const limit = Number(pagination.limit || 20);

    let transactionsQuery = Transaction.find(query).sort({ createdAt: -1 });
    if (populateUser) {
        transactionsQuery = transactionsQuery.populate('userId', 'name phoneNumber email');
    }
    const [transactions, total] = await Promise.all([
        transactionsQuery.skip(offset).limit(limit).lean(),
        Transaction.countDocuments(query),
    ]);

    return {
        transactions,
        total,
        page: Math.max(1, Math.floor(offset / limit) + 1),
        limit,
    };
}


async function getTransactions(userId, filters = {}, pagination = {}) {
    return listTransactions(buildTransactionQuery({ ...filters, userId }), pagination);
}

async function getAllTransactions(filters = {}, pagination = {}) {
    return listTransactions(buildTransactionQuery(filters), pagination, true);
}

async function cancelTransaction({ userId, transactionId }) {
    const session = await mongoose.startSession()
    try {
        let cancelledTransaction;
        await session.withTransaction(async () => {
            const transaction = await Transaction.findOne({
                _id: transactionId,
                userId,
                status: TRANSACTION_STATUS.PENDING
            }).session(session)
            if (!transaction) throw error("Transaction Not Found")

            if (transaction.type === TRANSACTION_TYPE.WITHDRAWAL) {
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

const createTransaction = async (transactionData, session = null) => {
    const [transaction] = await Transaction.create(
        [normalizeMoneyFields(transactionData)],
        session ? { session } : {}
    );

    return transaction;
};

const updateTransaction = async ({ transactionId, updates, query = {} }, session) => {
    const updatedTransaction = await Transaction.findOneAndUpdate(
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
    updateTransaction,
    getTransactions,
    getAllTransactions,
    cancelTransaction
}