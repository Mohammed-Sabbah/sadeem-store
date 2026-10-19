const mongoose = require('mongoose');
const { STATUS, STATUS_VALUES, APPROVE_STATUS, APPROVE_STATUS_VALUES } = require('../constants/enums');

const variantSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        attributes: {
            type: Map,
            of: String,
            default: {},
        },
        price: {
            type: Number,
            required: true,
            min: 0.01,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            validate: Number.isInteger,
        },
        image: {
            type: String,
            trim: true,
            maxlength: 2048,
        },
        status: {
            type: String,
            enum: STATUS_VALUES,
            default: STATUS.ACTIVE,
        },
        approveStatus: {
            type: String,
            enum: APPROVE_STATUS_VALUES,
            default: APPROVE_STATUS.APPROVED,
        },
        rejectionReason: {
            type: String,
            default: '',
            trim: true,
            maxlength: 1000,
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

variantSchema.index({ productId: 1, isDeleted: 1 });

module.exports = mongoose.model('Variant', variantSchema);
