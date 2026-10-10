const mongoose = require('mongoose');

const productOptionSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        source: {
            type: String,
            enum: ['DEFINED', 'CUSTOM'],
            default: 'DEFINED',
        },
        label: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['COLOR', 'SIZE', 'TEXT', 'NUMERIC'],
            default: 'TEXT',
        },
        unit: {
            type: String,
            default: null,
            trim: true,
            lowercase: true,
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
        slug: {
            type: String,
            trim: true,
            default: null,
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

// Indexes
productSchema.index(
    { storeId: 1, slug: 1 },
    {
        unique: true,
        partialFilterExpression: { isDeleted: false, slug: { $type: 'string' } },
    }
);
productSchema.index({ 'options.key': 1, 'options.values': 1 });
productSchema.index({ storeId: 1, isActive: 1, isDeleted: 1, createdAt: -1 });
productSchema.index({ categoryId: 1, isActive: 1, isDeleted: 1, inStock: 1 });
productSchema.index({ isActive: 1, isDeleted: 1, minPrice: 1 });
productSchema.index({ isActive: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
