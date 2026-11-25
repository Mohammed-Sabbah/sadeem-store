const mongoose = require('mongoose');
const { STATUS, STATUS_VALUES, APPROVE_STATUS_VALUES, APPROVE_STATUS } = require('../constants/enums');
const { addressSchema } = require('./address');

const storeBalanceSchema = new mongoose.Schema(
    {
        pending: {
            type: Number,
            default: 0,
            min: 0,
        },
        available: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { _id: false }
);

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
        balance: {
            type: storeBalanceSchema,
            default: () => ({}),
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

storeSchema.pre('init', function (document) {
    if (typeof document.balance === 'number') {
        document.balance = {
            pending: 0,
            available: document.balance,
        };
    }
});

module.exports = mongoose.model('Store', storeSchema);
