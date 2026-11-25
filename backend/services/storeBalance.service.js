const Store = require("../models/Store");
const Transaction = require("../models/Transaction.model");
const { TRANSACTION_TYPE, TRANSACTION_STATUS } = require("../constants/enums");
const error = require("../utils/error");
const { createTransaction } = require("./transaction.service");
const { parsePositiveMoney, roundMoney } = require("../utils/wallet");

const ensureStoreBalanceObject = async (storeId, session) => {
    await Store.collection.updateOne(
        {
            _id: storeId,
            $or: [
                { balance: { $type: "number" } },
                { balance: null },
                { balance: { $exists: false } },
            ],
        },
        [{
            $set: {
                balance: {
                    pending: 0,
                    available: { $cond: [{ $isNumber: "$balance" }, "$balance", 0] },
                },
            },
        }],
        { session }
    );
};

const createStoreEarning = async ({ order, session }) => {
    const store = await Store.findOne({ _id: order.storeId, isDeleted: false })
        .select("ownerId")
        .session(session);
    if (!store) {
        throw error("Store not found", 404);
    }
    await ensureStoreBalanceObject(store._id, session);

    const amount = roundMoney(order.subtotal);
    const transaction = await createTransaction({
        userId: store.ownerId,
        storeId: store._id,
        amount,
        type: TRANSACTION_TYPE.STORE_EARNING,
        status: TRANSACTION_STATUS.PENDING,
        referenceId: order._id.toString(),
    }, session);

    await Store.updateOne(
        { _id: store._id },
        { $inc: { "balance.pending": amount } },
        { session }
    );

    return transaction;
};

const updatePendingStoreEarning = async ({ order, session }) => {
    const transaction = await Transaction.findOne({
        storeId: order.storeId,
        referenceId: order._id.toString(),
        type: TRANSACTION_TYPE.STORE_EARNING,
        status: TRANSACTION_STATUS.PENDING,
    }).session(session);
    if (!transaction) {
        throw error("Pending store earning not found", 409);
    }
    await ensureStoreBalanceObject(order.storeId, session);

    const nextAmount = roundMoney(order.subtotal);
    const difference = roundMoney(transaction.amount - nextAmount);
    if (difference < 0) {
        throw error("Store earning cannot be increased during cancellation", 409);
    }

    if (difference > 0) {
        const result = await Store.updateOne(
            { _id: order.storeId, "balance.pending": { $gte: difference } },
            { $inc: { "balance.pending": -difference } },
            { session }
        );
        if (result.matchedCount !== 1) {
            throw error("Store pending balance is inconsistent", 409);
        }
    }

    if (nextAmount === 0) {
        transaction.status = TRANSACTION_STATUS.CANCELLED;
    } else {
        transaction.amount = nextAmount;
    }
    await transaction.save({ session });
};

const cancelPendingStoreEarning = async ({ order, session }) => {
    const earningQuery = {
        storeId: order.storeId,
        referenceId: order._id.toString(),
        type: TRANSACTION_TYPE.STORE_EARNING,
        status: TRANSACTION_STATUS.PENDING
    };
    const transaction = await Transaction.findOne(earningQuery)
        .session(session);
    if (!transaction) {
        const cancelledEarning = await Transaction.exists({
            ...earningQuery,
            status: TRANSACTION_STATUS.CANCELLED,
        }).session(session);
        if (cancelledEarning) {
            return;
        }
        throw error("Pending store earning not found", 409);
    }
    await ensureStoreBalanceObject(order.storeId, session);

    const result = await Store.updateOne(
        { _id: order.storeId, "balance.pending": { $gte: transaction.amount } },
        { $inc: { "balance.pending": -transaction.amount } },
        { session }
    );
    if (result.matchedCount !== 1) {
        throw error("Store pending balance is inconsistent", 409);
    }

    transaction.status = TRANSACTION_STATUS.CANCELLED;
    await transaction.save({ session });
};

const completeStoreEarnings = async ({ orders, session }) => {
    for (const order of orders) {
        const transaction = await Transaction.findOneAndUpdate(
            {
                storeId: order.storeId,
                referenceId: order._id.toString(),
                type: TRANSACTION_TYPE.STORE_EARNING,
                status: TRANSACTION_STATUS.PENDING,
            },
            { $set: { status: TRANSACTION_STATUS.COMPLETED } },
            { new: true, session }
        );
        if (!transaction) {
            throw error("Pending store earning not found", 409);
        }
        await ensureStoreBalanceObject(order.storeId, session);

        const result = await Store.updateOne(
            { _id: order.storeId, "balance.pending": { $gte: transaction.amount } },
            {
                $inc: {
                    "balance.pending": -transaction.amount,
                    "balance.available": transaction.amount,
                },
            },
            { session }
        );
        if (result.matchedCount !== 1) {
            throw error("Store pending balance is inconsistent", 409);
        }
    }
};

const getStoreBalance = async (storeId) => {
    const store = await Store.findOne({ _id: storeId, isDeleted: false })
        .select("balance")
        .lean();
    if (!store) {
        throw error("Store not found", 404);
    }

    return {
        pending: typeof store.balance === "number" ? 0 : store.balance?.pending || 0,
        available: typeof store.balance === "number"
            ? store.balance
            : store.balance?.available || 0,
    };
};

const createStorePayout = async ({ storeId, amount, adminId }) => {
    const payoutAmount = parsePositiveMoney(amount, "Payout amount");
    if (payoutAmount === 0) {
        throw error("Payout amount must be greater than zero", 400);
    }

    const session = await Store.startSession();
    try {
        let payout;
        await session.withTransaction(async () => {
            const store = await Store.findOne({ _id: storeId, isDeleted: false })
                .select("ownerId")
                .session(session);
            if (!store) {
                throw error("Store not found", 404);
            }
            await ensureStoreBalanceObject(storeId, session);

            const result = await Store.updateOne(
                { _id: storeId, "balance.available": { $gte: payoutAmount } },
                { $inc: { "balance.available": -payoutAmount } },
                { session }
            );
            if (result.matchedCount !== 1) {
                throw error("Payout amount exceeds the store's available balance", 409);
            }

            payout = await createTransaction({
                userId: store.ownerId,
                storeId: store._id,
                amount: payoutAmount,
                type: TRANSACTION_TYPE.STORE_PAYOUT,
                status: TRANSACTION_STATUS.APPROVED,
                createdBy: adminId,
                referenceId: store._id.toString(),
            }, session);
        });
        return payout;
    } finally {
        await session.endSession();
    }
};

module.exports = {
    createStoreEarning,
    updatePendingStoreEarning,
    cancelPendingStoreEarning,
    completeStoreEarnings,
    getStoreBalance,
    createStorePayout,
};
