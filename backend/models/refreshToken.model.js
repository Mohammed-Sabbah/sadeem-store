const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        tokenHash: {
            type: String,
            unique: true,
        },
        jti: {
            type: String,
            unique: true,
        },
        familyId: {
            type: String,
        },
        expiresAt: {
            type: Date,
            index: { expires: 0 },
        },
        revokedAt: {
            type: Date,
            default: null,
        },
    },
    { versionKey: false, timestamps: true }
);

refreshTokenSchema.index({ familyId: 1, revokedAt: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);