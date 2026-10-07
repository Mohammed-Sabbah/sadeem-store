const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
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
        },
        price: {
            type: Number,
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
