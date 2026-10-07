const mongoose = require('mongoose');
const { STATUS, STORE_APPROVE_STATUS } = require('../constants/enums');
const { createAddressSchema } = require('./address');

const addressSchema = createAddressSchema();

const storeSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            unique: true,
            index: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            index: true,
        },
        name: {
            type: String,
        },
        logo: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            default: '',
        },
        address: { type: addressSchema, default: () => ({}) },
        balance: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            default: STATUS.ACTIVE,
        },
        approveStatus: {
            type: String,
            default: STORE_APPROVE_STATUS.PENDING,
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

module.exports = mongoose.model('Store', storeSchema);
