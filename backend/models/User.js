const mongoose = require('mongoose');
const { ROLE, STATUS, STATUS_VALUES, ROLE_VALUES } = require('../constants/enums');
const { createAddressSchema } = require('./address');

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
            index: true,
        },
        password: {
            type: String,
            select: false,
        },
        addresses: {
            type: [createAddressSchema()],
            default: [],
        },
        role: {
            type: String,
            enum: ROLE_VALUES,
            default: ROLE.USER,
        },
        status: {
            type: String,
            enum: STATUS_VALUES,
            default: STATUS.ACTIVE,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

userSchema.methods.toSafeObject = function toSafeObject() {
    const obj = this.toObject();

    delete obj.password;

    return obj;
};

module.exports = mongoose.model('User', userSchema);
