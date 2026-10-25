const mongoose = require('mongoose');
const {
    WALLET_TRANSACTION_TYPE,
    WALLET_TRANSACTION_TYPE_VALUES,
    BALANCE_TYPE,
    BALANCE_TYPE_VALUES,
    TRANSACTION_STATUS,
    TRANSACTION_STATUS_VALUES,
} = require('../constants/enums');

const walletTransactionSchema = new mongoose.Schema(
    {
        walletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Wallet',
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        type: {
            type: String,
            enum: WALLET_TRANSACTION_TYPE_VALUES,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        balanceType: {
            type: String,
            enum: BALANCE_TYPE_VALUES,
            default: BALANCE_TYPE.WITHDRAWABLE,
        },
        balanceBefore: {
            type: Number,
            default: 0,
        },
        balanceAfter: {
            type: Number,
            default: 0,
        },
        referenceType: {
            type: String,
            enum: ['order', 'jawwal_pay', 'admin_adjustment', 'initial_bonus', 'deposit', 'withdrawal'],
            default: 'order',
        },
        referenceId: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: TRANSACTION_STATUS_VALUES,
            default: TRANSACTION_STATUS.COMPLETED,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        rejectReason: {
            type: String,
            default: '',
        },
        proofImage: {
            type: String,
            default: '',
        },
        payoutDetails: {
            type: Object,
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
        idempotencyKey: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            default: '',
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ status: 1, type: 1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
