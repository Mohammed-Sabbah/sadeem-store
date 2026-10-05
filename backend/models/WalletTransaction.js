const mongoose = require('mongoose');

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
            enum: ['deposit', 'purchase', 'refund', 'withdrawal', 'adjustment'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        balanceBefore: {
            type: Number,
            required: true,
        },
        balanceAfter: {
            type: Number,
            required: true,
        },
        referenceType: {
            type: String,
            enum: ['order', 'jawwal_pay', 'admin_adjustment', 'initial_bonus'],
            default: 'order',
        },
        referenceId: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'cancelled'],
            default: 'completed',
        },
        description: {
            type: String,
            default: '',
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
