const mongoose = require('mongoose');

const productOptionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        values: {
            type: [String],
            required: true,
            default: [],
        },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            default: '',
            trim: true,
        },
        images: {
            type: [String],
            default: [],
        },
        options: {
            type: [productOptionSchema],
            default: [],
        },
        minPrice: {
            type: Number,
            default: 0,
            min: 0,
            index: true,
        },
        maxPrice: {
            type: Number,
            default: 0,
            min: 0,
            index: true,
        },
        totalStock: {
            type: Number,
            default: 0,
            min: 0,
        },
        inStock: {
            type: Boolean,
            default: false,
            index: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
            index: true,
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

productSchema.index({ storeId: 1, isActive: 1, isDeleted: 1, createdAt: -1 });
productSchema.index({ categoryId: 1, isActive: 1, isDeleted: 1, inStock: 1 });
productSchema.index({ isActive: 1, isDeleted: 1, minPrice: 1 });
productSchema.index({ isActive: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
