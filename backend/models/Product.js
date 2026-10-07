const mongoose = require('mongoose');

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
        },
        description: {
            type: String,
            required: true,
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
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

productSchema.index({ storeId: 1, isActive: 1, isSuspended: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
