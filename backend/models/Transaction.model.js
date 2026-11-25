const mongoose = require('mongoose');
const {
    TRANSACTION_TYPE_VALUES,
    TRANSFER_PROVIDER_VALUES,
    BALANCE_TYPE_VALUES,
    TRANSACTION_STATUS,
    TRANSACTION_STATUS_VALUES,
} = require('../constants/enums');
const { isMoneyAmount } = require('../utils/wallet');

const payoutDetailsSchema = new mongoose.Schema(
    {
        transferProvider: {
            type: String,
            required: true,
            enum: TRANSFER_PROVIDER_VALUES,
            trim: true,
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

const transactionSchema = new mongoose.Schema(
    {
        walletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Wallet',
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            index: true,
        },
        type: {
            type: String,
            enum: TRANSACTION_TYPE_VALUES,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01,
            validate: {
                validator: isMoneyAmount,
                message: 'Amount must have at most two decimal places',
            },
        },
        allocations: {
            storeCreditBalance: {
                type: Number,
                min: 0,
            },
            withdrawableBalance: {
                type: Number,
                min: 0,
            },
        },
        balanceType: {
            type: String,
            enum: BALANCE_TYPE_VALUES,
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
            required: function () {
                return this.type === 'deposit';
            },
            trim: true,
        },
        transferProvider: {
            type: String,
            enum: TRANSFER_PROVIDER_VALUES,
            required: function () {
                return this.type === 'deposit';
            },
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

transactionSchema.index({ walletId: 1, createdAt: -1 });
transactionSchema.index({ storeId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ userId: 1, idempotencyKey: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
