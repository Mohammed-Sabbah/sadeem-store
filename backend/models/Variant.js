const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true,
        },
        sku: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        attributes: {
            type: Map,
            of: String,
            default: () => new Map(),
        },
        attrKey: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        compareAtPrice: {
            type: Number,
            min: 0,
            default: null,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        image: {
            type: String,
            default: '',
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
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

// Compound Unique Index: Prevents duplicate combination (e.g. Red + L) within the same product
variantSchema.index({ productId: 1, attrKey: 1 }, { unique: true });
variantSchema.index({ productId: 1, price: 1 });
variantSchema.index({ productId: 1, stock: 1 });

// Pre-validate hook to calculate deterministic, sorted attrKey from attributes
variantSchema.pre('validate', function (next) {
    if (this.attributes) {
        let entries = [];
        if (this.attributes instanceof Map) {
            entries = [...this.attributes.entries()];
        } else if (typeof this.attributes === 'object') {
            entries = Object.entries(this.attributes);
        }

        const sorted = entries
            .filter(([k, v]) => k && v !== undefined && v !== null && String(v).trim())
            .map(([k, v]) => [String(k).trim(), String(v).trim()])
            .sort(([a], [b]) => a.localeCompare(b));

        this.attrKey = sorted.length > 0
            ? sorted.map(([k, v]) => `${k}:${v}`).join('|')
            : 'default';
    } else {
        this.attrKey = 'default';
    }
    next();
});

module.exports = mongoose.model('Variant', variantSchema);
