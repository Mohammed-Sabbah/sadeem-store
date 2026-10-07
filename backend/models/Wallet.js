const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            unique: true,
            index: true,
        },
        balance: {
            type: Number,
            default: 0,
        },
        currency: {
            type: String,
            default: 'ILS',
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

module.exports = mongoose.model('Wallet', walletSchema);
