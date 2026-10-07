const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true,
        },
        image: {
            type: String,
        },
        color: {
            type: String,
        },
        size: {
            type: String,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        isSuspended: {
            type: Boolean,
            default: false,
            index: true,
        },
        suspensionReason: {
            type: String,
            default: null,
            trim: true,
            maxlength: 500,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

variantSchema.index({ productId: 1, price: 1 });
variantSchema.index({ productId: 1, stock: 1 });

module.exports = mongoose.model('Variant', variantSchema);
