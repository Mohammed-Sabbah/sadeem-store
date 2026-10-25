const mongoose = require('mongoose');
const { WALLET_STATUS, WALLET_STATUS_VALUES } = require('../constants/enums');

const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        withdrawableBalance: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        storeCreditBalance: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        currency: {
            type: String,
            default: 'ILS',
        },
        status: {
            type: String,
            enum: WALLET_STATUS_VALUES,
            default: WALLET_STATUS.ACTIVE,
        },
        isFrozen: {
            type: Boolean,
            default: false,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

walletSchema.virtual('totalBalance').get(function () {
    return this.withdrawableBalance + this.storeCreditBalance;
});

walletSchema.pre('save', function syncBalance(next) {
    const total = Number(this.withdrawableBalance || 0) + Number(this.storeCreditBalance || 0);
    this.balance = total;
    next();
});

walletSchema.set('toJSON', { virtuals: true });
walletSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Wallet', walletSchema);
