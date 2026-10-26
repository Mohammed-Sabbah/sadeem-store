const mongoose = require('mongoose');
const {
    WALLET_TRANSACTION_TYPE_VALUES,
    BALANCE_TYPE,
    BALANCE_TYPE_VALUES,
    TRANSACTION_STATUS,
    TRANSACTION_STATUS_VALUES,
} = require('../constants/enums');

const payoutDetailsSchema = new mongoose.Schema(
    {
        bankName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        accountNumber: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },
        accountName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
    },
    { _id: false }
);

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
            required: true,
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
            min: 0.01,
            validate: {
                validator: (value) => Number.isFinite(value) && Math.round(value * 100) === value * 100,
                message: 'Amount must have at most two decimal places',
            },
        },
        allocations: {
            storeCreditBalance: {
                type: Number,
                required: true,
                min: 0,
            },
            withdrawableBalance: {
                type: Number,
                required: true,
                min: 0,
            },
        },
        balanceType: {
            type: String,
            enum: BALANCE_TYPE_VALUES,
            required: true,
        },
        status: {
            type: String,
            enum: TRANSACTION_STATUS_VALUES,
            default: TRANSACTION_STATUS.PENDING,
            required: true,
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
            maxlength: 500,
            trim: true,
        },
        proofImage: {
            type: String,
            required: () => this.type === 'deposit',
            trim: true,
        },
        isProofReviewed: {
            type: Boolean,
            default: false,
        },
        payoutDetails: {
            type: payoutDetailsSchema,
        },
        reviewedAt: {
            type: Date,
        },
        idempotencyKey: {
            type: String,
            default: '',
            trim: true,
            maxlength: 128,
        },
        referenceId: {
            type: String,
            default: '',
            trim: true,
            maxlength: 200,
        }
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ status: 1, type: 1 });
walletTransactionSchema.index({ userId: 1, idempotencyKey: 1, type: 1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
