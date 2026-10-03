const mongoose = require('mongoose');
const { STATUS } = require('../constants/enums');

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
        address: {
            type: String,
            default: '',
        },
        phoneNumber: {
            type: String,
            default: '',
        },
        balance: {
            type: Number,
            default: 0,
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

module.exports = mongoose.model('Store', storeSchema);
