const mongoose = require('mongoose');
const { STATUS, STATUS_VALUES, APPROVE_STATUS, APPROVE_STATUS_VALUES } = require('../constants/enums');

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
        images: {
            type: [
                {
                    type: String,
                    trim: true,
                    maxlength: 2048,
                },
            ],
            default: [],
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

module.exports = mongoose.model('Product', productSchema);
