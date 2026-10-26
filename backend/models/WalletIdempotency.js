const mongoose = require('mongoose');

const walletIdempotencySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        key: {
            type: String,
            required: true,
            trim: true,
            maxlength: 128,
        },
        requestHash: {
            type: String,
            required: true,
        },
        result: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

walletIdempotencySchema.index({ userId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('WalletIdempotency', walletIdempotencySchema);
