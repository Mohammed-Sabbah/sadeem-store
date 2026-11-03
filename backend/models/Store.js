const mongoose = require('mongoose');
const { STATUS, STATUS_VALUES, APPROVE_STATUS_VALUES, APPROVE_STATUS } = require('../constants/enums');
const { addressSchema } = require('./address');


const storeSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
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
            type: addressSchema,
            required: true,
        },
        regionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Region',
            required: true,
            index: true
        },
        balance: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: STATUS_VALUES,
            default: STATUS.ACTIVE,
        },
        approveStatus: {
            type: String,
            enum: APPROVE_STATUS_VALUES,
            default: APPROVE_STATUS.PENDING,
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
