const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            index: true,
        },
        title: {
            type: String,
        },
        description: {
            type: String,
        },
        images: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
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
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

productSchema.index({ storeId: 1, isActive: 1, isSuspended: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
