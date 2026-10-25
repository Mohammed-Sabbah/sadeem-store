const mongoose = require("mongoose")

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true,
    },
    sentTo: {
        type: String,
    },
    hashedOtp: {
        type: String,
        select: false,
    },
    sessionTokenHash: {
        type: String,
        select: false,
    },
    resetTokenHash: {
        type: String,
        select: false,
    },
    expiresAt: {
        type: Date,
        expires: 0,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Otp = mongoose.model("otp", otpSchema)
module.exports = Otp