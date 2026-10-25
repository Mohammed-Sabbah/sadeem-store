const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const {
    ROLE,
    STATUS,
    BALANCE_TYPE,
    WALLET_TRANSACTION_TYPE,
    TRANSACTION_STATUS,
} = require('../constants/enums');

function normalizeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

async function withWalletSession(operation) {
    const session = await mongoose.startSession();

    try {
        return await session.withTransaction(async () => operation(session));
    } finally {
        await session.endSession();
    }
}

async function getOrCreateWallet(userId, session = null) {
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
        throw new Error('Invalid user id');
    }

    const user = await User.findById(userId).lean();
    if (!user) {
        throw new Error('User not found');
    }

    if (user.role !== ROLE.USER) {
        return null;
    }

    const wallet = await Wallet.findOne({ userId }).session(session || null);
    if (wallet) {
        return wallet;
    }

    const [createdWallet] = await Wallet.create([
        {
            userId,
            withdrawableBalance: 0,
            storeCreditBalance: 0,
            balance: 0,
            currency: 'ILS',
            status: STATUS.ACTIVE,
        },
    ], session ? { session } : {});

    return createdWallet;
}

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

    const query = { walletId };
    const offset = Number(pagination.offset || 0);
    const limit = Number(pagination.limit || 20);

    if (filters.type) {
        query.type = filters.type;
    }

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.balanceType) {
        query.balanceType = filters.balanceType;
    }

    if (filters.createdFrom || filters.createdTo) {
        query.createdAt = {};
        if (filters.createdFrom) {
            query.createdAt.$gte = new Date(filters.createdFrom);
        }
        if (filters.createdTo) {
            query.createdAt.$lte = new Date(filters.createdTo);
        }
    }

    const [transactions, total] = await Promise.all([
        WalletTransaction.find(query)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean(),
        WalletTransaction.countDocuments(query),
    ]);

    return {
        transactions,
        total,
        page: Math.max(1, Math.floor(offset / limit) + 1),
        limit,
    };
}

async function createDepositRequest({ walletId, userId, amount, proofImage = '', referenceId = '', description = 'Deposit request' }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
        throw new Error('Invalid user id');
    }

    const numericAmount = normalizeNumber(amount, 0);
    if (numericAmount <= 0) {
        throw new Error('Deposit amount must be greater than zero');
    }

    return WalletTransaction.create({
        walletId,
        userId,
        type: WALLET_TRANSACTION_TYPE.DEPOSIT,
        status: TRANSACTION_STATUS.PENDING,
        amount: numericAmount,
        balanceType: BALANCE_TYPE.WITHDRAWABLE,
        createdBy: userId,
        referenceId: String(referenceId || ''),
        proofImage: String(proofImage || ''),
        description: String(description),
    });
}

async function completeDeposit({ adminId, transactionId }) {
    if (!adminId || !mongoose.Types.ObjectId.isValid(String(adminId))) {
        throw new Error('Invalid admin id');
    }

    const complete = async (transactionSession) => {
        const deposit = await WalletTransaction.findOne({
            _id: transactionId,
            type: WALLET_TRANSACTION_TYPE.DEPOSIT,
            status: TRANSACTION_STATUS.PENDING,
        }).session(transactionSession);

        if (!deposit) {
            throw new Error('Pending deposit not found');
        }

        const wallet = await Wallet.findById(deposit.walletId).session(transactionSession);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const updatedTx = await WalletTransaction.findOneAndUpdate(
            {
                _id: deposit._id,
                type: WALLET_TRANSACTION_TYPE.DEPOSIT,
                status: TRANSACTION_STATUS.PENDING,
            },
            {
                $set: {
                    status: TRANSACTION_STATUS.COMPLETED,
                    balanceType: BALANCE_TYPE.WITHDRAWABLE,
                    verifiedBy: adminId,
                    reviewedAt: new Date(),
                    rejectReason: '',
                },
            },
            {
                new: true,
                session: transactionSession,
            }
        );

        if (!updatedTx) {
            throw new Error('Deposit could not be completed');
        }

        const walletUpdate = await Wallet.updateOne(
            { _id: wallet._id },
            {
                $inc: {
                    withdrawableBalance: deposit.amount,
                    balance: deposit.amount,
                },
            },
            { session: transactionSession }
        );

        if (walletUpdate.modifiedCount !== 1) {
            throw new Error('Deposit wallet balance could not be updated');
        }

        return {
            wallet: await Wallet.findById(wallet._id).session(transactionSession).lean(),
            transaction: updatedTx,
        };
    };

    return withWalletSession(complete);
}

async function rejectDeposit({ adminId, transactionId, rejectReason = '', session = null }) {
    if (!adminId || !mongoose.Types.ObjectId.isValid(String(adminId))) {
        throw new Error('Invalid admin id');
    }

    const deposit = await WalletTransaction.findOne({
        _id: transactionId,
        type: WALLET_TRANSACTION_TYPE.DEPOSIT,
        status: TRANSACTION_STATUS.PENDING,
    }).session(session || null);

    if (!deposit) {
        throw new Error('Pending deposit not found');
    }

    const updatedTx = await WalletTransaction.findOneAndUpdate(
        { _id: deposit._id, status: TRANSACTION_STATUS.PENDING },
        {
            $set: {
                status: TRANSACTION_STATUS.REJECTED,
                verifiedBy: adminId,
                reviewedAt: new Date(),
                rejectReason: String(rejectReason || ''),
            },
        },
        { new: true, session: session || undefined }
    );

    return updatedTx;
}

async function deductWalletForOrder({ userId, amount, orderId = '', session = null }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
        throw new Error('Invalid user id');
    }

    const totalAmount = normalizeNumber(amount, 0);
    if (totalAmount <= 0) {
        throw new Error('Payment amount must be greater than zero');
    }

    const wallet = await Wallet.findOne({ userId }).session(session || null);
    if (!wallet) {
        throw new Error('Wallet not found');
    }

    const totalAvailable = Number(wallet.storeCreditBalance || 0) + Number(wallet.withdrawableBalance || 0);
    if (totalAvailable < totalAmount) {
        return { ok: false, message: 'Insufficient wallet funds', wallet };
    }

    const fromStoreCredit = Math.min(Number(wallet.storeCreditBalance || 0), totalAmount);
    const fromWithdrawable = totalAmount - fromStoreCredit;

    const walletResult = await Wallet.updateOne(
        {
            _id: wallet._id,
            storeCreditBalance: { $gte: fromStoreCredit },
            withdrawableBalance: { $gte: fromWithdrawable },
        },
        {
            $inc: {
                storeCreditBalance: -fromStoreCredit,
                withdrawableBalance: -fromWithdrawable,
                balance: -totalAmount,
            },
        },
        session ? { session } : {}
    );

    if (walletResult.modifiedCount !== 1) {
        throw new Error('Wallet deduction failed due to a concurrent update');
    }

    const createdTransactions = [];

    if (fromStoreCredit > 0) {
        createdTransactions.push(await WalletTransaction.create([{
            walletId: wallet._id,
            userId,
            type: WALLET_TRANSACTION_TYPE.ORDER_PAYMENT,
            status: TRANSACTION_STATUS.COMPLETED,
            amount: fromStoreCredit,
            balanceType: BALANCE_TYPE.STORE_CREDIT,
            referenceId: String(orderId || ''),
            referenceType: 'order',
            description: 'Wallet order payment',
        }], session ? { session } : {}));
    }

    if (fromWithdrawable > 0) {
        createdTransactions.push(await WalletTransaction.create([{
            walletId: wallet._id,
            userId,
            type: WALLET_TRANSACTION_TYPE.ORDER_PAYMENT,
            status: TRANSACTION_STATUS.COMPLETED,
            amount: fromWithdrawable,
            balanceType: BALANCE_TYPE.WITHDRAWABLE,
            referenceId: String(orderId || ''),
            referenceType: 'order',
            description: 'Wallet order payment',
        }], session ? { session } : {}));
    }

    return {
        ok: true,
        wallet: await Wallet.findById(wallet._id).lean(),
        transactions: createdTransactions.flat(),
    };
}

async function refundOrderPayment({ userId, orderId = '', paymentBreakdown = [], session = null }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
        throw new Error('Invalid user id');
    }

    const wallet = await Wallet.findOne({ userId }).session(session || null);
    if (!wallet) {
        throw new Error('Wallet not found');
    }

    const entries = Array.isArray(paymentBreakdown) ? paymentBreakdown : Object.values(paymentBreakdown || {});
    const refundPlan = entries.map((entry) => {
        const amount = normalizeNumber(entry.amount || entry.value || entry.total || 0, 0);
        const balanceType = entry.balanceType || (entry.type === 'jawwal' ? BALANCE_TYPE.STORE_CREDIT : BALANCE_TYPE.WITHDRAWABLE);
        return {
            amount,
            balanceType,
        };
    }).filter((entry) => entry.amount > 0);

    if (refundPlan.length === 0) {
        return { ok: true, wallet, transactions: [] };
    }

    const update = { $inc: { balance: 0 } };
    refundPlan.forEach((entry) => {
        const field = entry.balanceType === BALANCE_TYPE.STORE_CREDIT ? 'storeCreditBalance' : 'withdrawableBalance';
        update.$inc[field] = (update.$inc[field] || 0) + entry.amount;
        update.$inc.balance += entry.amount;
    });

    await Wallet.updateOne({ _id: wallet._id }, update, session ? { session } : {});

    const createdTransactions = [];
    for (const entry of refundPlan) {
        const tx = await WalletTransaction.create([{
            walletId: wallet._id,
            userId,
            type: WALLET_TRANSACTION_TYPE.ORDER_REFUND,
            status: TRANSACTION_STATUS.COMPLETED,
            amount: entry.amount,
            balanceType: entry.balanceType,
            referenceId: String(orderId || ''),
            referenceType: 'order',
            description: 'Order refund',
        }], session ? { session } : {});
        createdTransactions.push(tx[0]);
    }

    return {
        ok: true,
        wallet: await Wallet.findById(wallet._id).lean(),
        transactions: createdTransactions,
    };
}

async function createWithdrawalRequest({ userId, amount, payoutDetails = {} }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
        throw new Error('Invalid user id');
    }

    const numericAmount = normalizeNumber(amount, 0);
    if (numericAmount <= 0) {
        throw new Error('Withdrawal amount must be greater than zero');
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
        throw new Error('Wallet not found');
    }

    return WalletTransaction.create({
        walletId: wallet._id,
        userId,
        type: WALLET_TRANSACTION_TYPE.WITHDRAWAL,
        status: TRANSACTION_STATUS.PENDING,
        amount: numericAmount,
        balanceType: BALANCE_TYPE.WITHDRAWABLE,
        createdBy: userId,
        payoutDetails,
        description: 'Withdrawal request',
    });
}

async function approveWithdrawal({ adminId, transactionId }) {
    if (!adminId || !mongoose.Types.ObjectId.isValid(String(adminId))) {
        throw new Error('Invalid admin id');
    }

    return withWalletSession(async (session) => {
        const withdrawal = await WalletTransaction.findOne({
            _id: transactionId,
            type: WALLET_TRANSACTION_TYPE.WITHDRAWAL,
            status: TRANSACTION_STATUS.PENDING,
        }).session(session);

        if (!withdrawal) {
            throw new Error('Pending withdrawal not found');
        }

        if (withdrawal.balanceType !== BALANCE_TYPE.WITHDRAWABLE) {
            throw new Error('Withdrawals can only use withdrawable balance');
        }

        const wallet = await Wallet.findOne({
            _id: withdrawal.walletId,
            userId: withdrawal.userId,
        }).session(session);

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const walletUpdate = await Wallet.updateOne(
            {
                _id: wallet._id,
                withdrawableBalance: { $gte: withdrawal.amount },
            },
            { $inc: { withdrawableBalance: -withdrawal.amount } },
            { session }
        );

        if (walletUpdate.modifiedCount !== 1) {
            throw new Error('Insufficient withdrawable balance');
        }

        const approvedWithdrawal = await WalletTransaction.findOneAndUpdate(
            {
                _id: withdrawal._id,
                type: WALLET_TRANSACTION_TYPE.WITHDRAWAL,
                status: TRANSACTION_STATUS.PENDING,
            },
            {
                $set: {
                    status: TRANSACTION_STATUS.APPROVED,
                    verifiedBy: adminId,
                    reviewedAt: new Date(),
                },
            },
            { new: true, session }
        );

        if (!approvedWithdrawal) {
            throw new Error('Withdrawal could not be approved');
        }

        return approvedWithdrawal;
    });
}

async function completeWithdrawal({ adminId, transactionId, payoutReference = '' }) {
    if (!adminId || !mongoose.Types.ObjectId.isValid(String(adminId))) {
        throw new Error('Invalid admin id');
    }

    return withWalletSession(async (session) => {
        const updates = {
            status: TRANSACTION_STATUS.COMPLETED,
            verifiedBy: adminId,
            reviewedAt: new Date(),
        };
        if (payoutReference) {
            updates.referenceId = String(payoutReference);
        }

        const completedWithdrawal = await WalletTransaction.findOneAndUpdate(
            {
                _id: transactionId,
                type: WALLET_TRANSACTION_TYPE.WITHDRAWAL,
                status: TRANSACTION_STATUS.APPROVED,
            },
            { $set: updates },
            { new: true, session }
        );

        if (!completedWithdrawal) {
            throw new Error('Approved withdrawal not found');
        }

        return completedWithdrawal;
    });
}

async function rejectWithdrawal({ adminId, transactionId, rejectReason = '' }) {
    if (!adminId || !mongoose.Types.ObjectId.isValid(String(adminId))) {
        throw new Error('Invalid admin id');
    }

    const withdrawal = await WalletTransaction.findOne({
        _id: transactionId,
        type: WALLET_TRANSACTION_TYPE.WITHDRAWAL,
        status: TRANSACTION_STATUS.PENDING,
    });

    if (!withdrawal) {
        throw new Error('Pending withdrawal not found');
    }

    return WalletTransaction.findOneAndUpdate(
        { _id: withdrawal._id, status: TRANSACTION_STATUS.PENDING },
        {
            $set: {
                status: TRANSACTION_STATUS.REJECTED,
                verifiedBy: adminId,
                reviewedAt: new Date(),
                rejectReason: String(rejectReason || ''),
            },
        },
        { new: true }
    );
}

module.exports = {
    withWalletSession,
    getOrCreateWallet,
    getWalletByUserId,
    getWalletTransactions,
    createDepositRequest,
    completeDeposit,
    rejectDeposit,
    deductWalletForOrder,
    refundOrderPayment,
    createWithdrawalRequest,
    approveWithdrawal,
    completeWithdrawal,
    rejectWithdrawal,
};
