const mongoose = require('mongoose');
const { ROLE, STATUS } = require('../constants/enums');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        phoneNumber: {
            type: String,
        },
        email: {
            type: String,
            unique: true,
            lowercase: true,
            index: true,
        },
        password: {
            type: String,
            select: false,
        },
        addresses: {
            type: [Object],
            default: [],
        },
        role: {
            type: String,
            enum: Object.values(ROLE),
            default: ROLE.USER,
        },
        status: {
            type: String,
            enum: Object.values(STATUS),
            default: STATUS.ACTIVE,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        versionKey: false,
        timestamps: false,
    }
);

userSchema.methods.toSafeObject = function toSafeObject() {
    const obj = this.toObject();

    delete obj.password;

    return obj;
};

module.exports = mongoose.model('User', userSchema);
