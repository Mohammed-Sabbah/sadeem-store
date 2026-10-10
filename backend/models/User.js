const mongoose = require('mongoose');
const { ROLE, STATUS, ROLE_VALUES, STATUS_VALUES } = require('../constants/enums');
const { createAddressSchema } = require('./address');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        password: {
            type: String,
            required: true,
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
