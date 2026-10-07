const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
    {
        walletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Wallet',
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        type: {
            type: String,
        },
        amount: {
            type: Number,
        },
        balanceBefore: {
            type: Number,
        },
        balanceAfter: {
            type: Number,
        },
        referenceType: {
            type: String,
            default: 'order',
        },
        referenceId: {
            type: String,
            default: '',
        },
        status: {
            type: String,
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
