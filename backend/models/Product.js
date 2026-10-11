const mongoose = require('mongoose');
const { STATUS, STATUS_VALUES, APPROVE_STATUS, APPROVE_STATUS_VALUES } = require('../constants/enums');

const variantSchema = new mongoose.Schema(
    {
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
    },
    { timestamps: true }
);

const productSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160,
        },
        description: {
            type: String,
            default: '',
            maxlength: 3000,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
            index: true,
        },
        image: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2048,
        },
        variants: {
            type: [variantSchema],
            validate: {
                validator: (variants) => variants.length > 0,
                message: 'A product must have at least one variant',
            },
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

module.exports = mongoose.model('Product', productSchema);
