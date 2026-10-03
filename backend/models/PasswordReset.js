const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        otpHash: {
            type: String,
            select: false,
        },
        otpAttempts: {
            type: Number,
            default: 0,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        resetTokenHash: {
            type: String,
            select: false,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 },
        },
    },
    { versionKey: false, timestamps: true }
);

module.exports = mongoose.model('PasswordReset', passwordResetSchema);