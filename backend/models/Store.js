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
        governorate: {
            type: String,
            default: 'central',
        },
        city: {
            type: String,
            default: 'deir_albalah',
        },
        location: {
            lat: { type: Number, default: 31.418 },
            lng: { type: Number, default: 34.351 },
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
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

module.exports = mongoose.model('Store', storeSchema);
