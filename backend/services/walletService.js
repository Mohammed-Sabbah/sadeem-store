const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const { withWalletIdempotency } = require('./walletIdempotency');
const { createTransaction } = require("./transaction.service")
const {
    parsePositiveMoney,
} = require("../utils/wallet")
const error = require("../utils/error")
const {
    WALLET_TRANSACTION_TYPE,
    TRANSACTION_STATUS,
    WALLET_TRANSACTION_TYPE_VALUES,
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

async function cancelWalletTransaction({ userId, transactionId, idempotencyKey }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
        throw error('Invalid user id');
    }
    if (!mongoose.Types.ObjectId.isValid(String(transactionId))) {
        throw error('Invalid transaction id');
    }

    return withWalletIdempotency({
        userId,
        idempotencyKey,
        operation: 'cancel-wallet-transaction',
        payload: { transactionId: String(transactionId) },
    }, async (session) => {
        const transaction = await WalletTransaction.findOne({
            _id: transactionId,
            userId,
            status: TRANSACTION_STATUS.PENDING,
        }).session(session);

        if (!transaction) {
            const existing = await WalletTransaction.findOne({
                _id: transactionId,
                userId,
            }).select('status').session(session).lean();

            throw error(
                existing ? 'Only pending transactions can be cancelled' : 'Transaction not found',
                existing ? 409 : 404
            );
        }

        // A withdrawal reserves funds when requested, so cancellation must release that reservation.
        if (transaction.type === WALLET_TRANSACTION_TYPE.WITHDRAWAL) {
            const refund = await Wallet.updateOne(
                { _id: transaction.walletId, userId },
                {
                    $inc: {
                        withdrawableBalance: transaction.amount,
                    },
                },
                { session }
            );
            if (refund.modifiedCount !== 1) {
                throw error('Reserved withdrawal funds could not be released', 500);
            }
        }

        transaction.status = TRANSACTION_STATUS.CANCELLED;
        transaction.reviewedAt = new Date();
        await transaction.save({ session });
        return transaction.toObject();
    });
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

// Deposits  
// async function createDepositRequest({
//     userId,
//     amount,
//     proofImage,
//     idempotencyKey,
//     idempotencyPayload,
// }) {
//     if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
//         throw error('Invalid user id');
//     }

//     const numericAmount = parsePositiveMoney(amount, 'Deposit amount');
//     if (typeof proofImage !== 'string' || !proofImage.trim()) {
//         throw error('Deposit proof image is required');
//     }

//     return withWalletIdempotency({
//         userId,
//         idempotencyKey,
//         operation: 'create-deposit',
//         payload: idempotencyPayload || {
//             amount: numericAmount,
//             proofImage: proofImage.trim(),
//         },
//     }, async (session, key) => {
//         const wallet = await Wallet.findOne({
//             userId,
//             isFrozen: false,
//         }).session(session).lean();

//         if (!wallet) {
//             throw error('Active wallet not found', 404);
//         }

//         const [transaction] = await WalletTransaction.create([{
//             walletId: wallet._id,
//             userId,
//             type: WALLET_TRANSACTION_TYPE.DEPOSIT,
//             status: TRANSACTION_STATUS.PENDING,
//             amount: numericAmount,
//             balanceType: BALANCE_TYPE.WITHDRAWABLE,
//             createdBy: userId,
//             proofImage: proofImage.trim(),
//             idempotencyKey: key,
//         }], { session });

//         return transaction;
//     });
// }

// async function approveDeposit({ adminId, transactionId, amount, proofReviewed, idempotencyKey }) {
//     if (!adminId || !mongoose.Types.ObjectId.isValid(String(adminId))) {
//         throw error('Invalid admin id');
//     }
//     if (!mongoose.Types.ObjectId.isValid(String(transactionId))) {
//         throw error('Invalid transaction id');
//     }
//     if (proofReviewed !== true && proofReviewed !== 'true') {
//         throw error('Deposit proof must be reviewed before approval');
//     }

//     const approvedAmount = amount === undefined
//         ? undefined
//         : parsePositiveMoney(amount, 'Approved deposit amount');

//     return withWalletIdempotency({
//         userId: adminId,
//         idempotencyKey,
//         operation: 'approve-deposit',
//         payload: { transactionId: String(transactionId), amount: approvedAmount ?? null, proofReviewed: true },
//     }, async (session) => {
//         const deposit = await WalletTransaction.findOne({
//             _id: transactionId,
//             type: WALLET_TRANSACTION_TYPE.DEPOSIT,
//             status: TRANSACTION_STATUS.PENDING,
//         }).session(session);

//         if (!deposit) {
//             throw error('Pending deposit not found', 404);
//         }
//         if (!deposit.proofImage || !deposit.proofImage.trim()) {
//             throw error('Deposit proof image is required before approval');
//         }

//         const finalAmount = approvedAmount ?? parsePositiveMoney(deposit.amount, 'Deposit amount');
//         const wallet = await Wallet.findOne({
//             _id: deposit.walletId,
//             userId: deposit.userId,
//             isFrozen: false,
//         }).session(session);

//         if (!wallet) {
//             throw error('Active wallet not found', 404);
//         }

//         const updatedWallet = await Wallet.updateOne(
//             { _id: wallet._id, userId: deposit.userId, isFrozen: false },
//             { $inc: { withdrawableBalance: finalAmount } },
//             { session }
//         );
//         if (updatedWallet.modifiedCount !== 1) {
//             throw error('Deposit wallet balance could not be updated', 409);
//         }

//         const updatedTx = await WalletTransaction.findOneAndUpdate(
//             {
//                 _id: deposit._id,
//                 type: WALLET_TRANSACTION_TYPE.DEPOSIT,
//                 status: TRANSACTION_STATUS.PENDING,
//             },
//             {
//                 $set: {
//                     status: TRANSACTION_STATUS.APPROVED,
//                     amount: finalAmount,
//                     balanceType: BALANCE_TYPE.WITHDRAWABLE,
//                     verifiedBy: adminId,
//                     reviewedAt: new Date(),
//                     rejectReason: '',
//                     isProofReviewed: true,
//                 },
//             },
//             { new: true, session, runValidators: true }
//         ).lean();

//         if (!updatedTx) {
//             throw error('Deposit could not be approved', 409);
//         }

//         return {
//             wallet: await Wallet.findById(wallet._id).session(session).lean(),
//             transaction: updatedTx,
//         };
//     });
// }

// async function rejectDeposit({ adminId, transactionId, rejectReason = '', idempotencyKey }) {
//     if (!adminId || !mongoose.Types.ObjectId.isValid(String(adminId))) {
//         throw error('Invalid admin id');
//     }
//     if (!mongoose.Types.ObjectId.isValid(String(transactionId))) {
//         throw error('Invalid transaction id');
//     }

//     const reason = String(rejectReason || '').trim().slice(0, 500);
//     return withWalletIdempotency({
//         userId: adminId,
//         idempotencyKey,
//         operation: 'reject-deposit',
//         payload: { transactionId: String(transactionId), rejectReason: reason },
//     }, async (session) => {
//         const updatedTx = await WalletTransaction.findOneAndUpdate(
//             {
//                 _id: transactionId,
//                 type: WALLET_TRANSACTION_TYPE.DEPOSIT,
//                 status: TRANSACTION_STATUS.PENDING,
//             },
//             {
//                 $set: {
//                     status: TRANSACTION_STATUS.REJECTED,
//                     verifiedBy: adminId,
//                     reviewedAt: new Date(),
//                     rejectReason: reason,
//                 },
//             },
//             { new: true, session, runValidators: true }
//         ).lean();

//         if (!updatedTx) {
//             throw error('Pending deposit not found', 404);
//         }
//         return updatedTx;
//     });
// }

// Withdrawals
// async function createWithdrawalRequest({ userId, amount, payoutDetails = {}, idempotencyKey }) {
//     if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
//         throw error('Invalid user id');
//     }

//     const numericAmount = parsePositiveMoney(amount, 'Withdrawal amount');

//     return withWalletIdempotency({
//         userId,
//         idempotencyKey,
//         operation: 'create-withdrawal',
//         payload: { amount: numericAmount, payoutDetails },
//     }, async (session, key) => {
//         const wallet = await Wallet.findOne({
//             userId,
//             isFrozen: false,
//         }).session(session);

//         if (!wallet) {
//             throw error('Active wallet not found', 404);
//         }

//         const reservation = await Wallet.updateOne(
//             {
//                 _id: wallet._id,
//                 userId,
//                 isFrozen: false,
//                 withdrawableBalance: { $gte: numericAmount },
//             },
//             {
//                 $inc: {
//                     withdrawableBalance: -numericAmount,
//                 },
//             },
//             { session }
//         );

//         if (reservation.modifiedCount !== 1) {
//             throw error('Insufficient withdrawable balance', 409);
//         }

//         const [transaction] = await WalletTransaction.create([{
//             walletId: wallet._id,
//             userId,
//             type: WALLET_TRANSACTION_TYPE.WITHDRAWAL,
//             status: TRANSACTION_STATUS.PENDING,
//             amount: numericAmount,
//             balanceType: BALANCE_TYPE.WITHDRAWABLE,
//             createdBy: userId,
//             payoutDetails,
//             idempotencyKey: key,
//         }], { session });

//         return transaction;
//     });
// }

// async function approveWithdrawal({ adminId, transactionId, payoutReference = '', idempotencyKey }) {
//     if (!adminId || !mongoose.Types.ObjectId.isValid(String(adminId))) {
//         throw error('Invalid admin id');
//     }
//     if (!mongoose.Types.ObjectId.isValid(String(transactionId))) {
//         throw error('Invalid transaction id');
//     }

//     const cleanPayoutReference = String(payoutReference || '').trim().slice(0, 200);

//     return withWalletIdempotency({
//         userId: adminId,
//         idempotencyKey,
//         operation: 'approve-withdrawal',
//         payload: { transactionId: String(transactionId), payoutReference: cleanPayoutReference },
//     }, async (session) => {
//         const withdrawal = await WalletTransaction.findOneAndUpdate(
//             {
//                 _id: transactionId,
//                 type: WALLET_TRANSACTION_TYPE.WITHDRAWAL,
//                 status: TRANSACTION_STATUS.PENDING,
//                 isDeleted: { $ne: true },
//             },
//             {
//                 $set: {
//                     status: TRANSACTION_STATUS.APPROVED,
//                     verifiedBy: adminId,
//                     reviewedAt: new Date(),
//                     referenceId: cleanPayoutReference,
//                 },
//             },
//             { new: true, session, runValidators: true }
//         ).lean();

//         if (!withdrawal) {
//             throw error('Pending withdrawal not found', 404);
//         }

//         return withdrawal;
//     });
// }

// async function rejectWithdrawal({ adminId, transactionId, rejectReason = '', idempotencyKey }) {
//     if (!adminId || !mongoose.Types.ObjectId.isValid(String(adminId))) {
//         throw error('Invalid admin id');
//     }
//     if (!mongoose.Types.ObjectId.isValid(String(transactionId))) {
//         throw error('Invalid transaction id');
//     }

//     const reason = String(rejectReason || '').trim().slice(0, 500);

//     return withWalletIdempotency({
//         userId: adminId,
//         idempotencyKey,
//         operation: 'reject-withdrawal',
//         payload: { transactionId: String(transactionId), rejectReason: reason },
//     }, async (session) => {
//         const withdrawal = await WalletTransaction.findOne({
//             _id: transactionId,
//             type: WALLET_TRANSACTION_TYPE.WITHDRAWAL,
//             status: TRANSACTION_STATUS.PENDING,
//         }).session(session);

//         if (!withdrawal) {
//             throw error('Pending withdrawal not found', 404);
//         }

//         const refund = await Wallet.updateOne(
//             {
//                 _id: withdrawal.walletId,
//                 userId: withdrawal.userId
//             },
//             {
//                 $inc: {
//                     withdrawableBalance: withdrawal.amount,
//                 },
//             },
//             { session }
//         );
//         if (refund.modifiedCount !== 1) {
//             throw error('Reserved withdrawal funds could not be released', 500);
//         }

//         const rejected = await WalletTransaction.findOneAndUpdate(
//             {
//                 _id: withdrawal._id,
//                 type: WALLET_TRANSACTION_TYPE.WITHDRAWAL,
//                 status: TRANSACTION_STATUS.PENDING,
//             },
//             {
//                 $set: {
//                     status: TRANSACTION_STATUS.REJECTED,
//                     verifiedBy: adminId,
//                     reviewedAt: new Date(),
//                     rejectReason: reason,
//                 },
//             },
//             { new: true, session, runValidators: true }
//         ).lean();

//         if (!rejected) {
//             throw error('Withdrawal could not be rejected', 409);
//         }
//         return rejected;
//     });
// }

module.exports = {
    getWalletByUserId,
    getWalletTransactions,
    getAllWalletTransactions,
    cancelWalletTransaction,
    increaseWalletBalance,
    decreaseWalletBalance
};
