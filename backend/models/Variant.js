const mongoose = require('mongoose');
const { isMoney, roundMoney } = require('../utils/money');

const variantSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true,
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        sku: {
            type: String,
            required: true,
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
            validate: {
                validator: function (v) {
                    return isMoney(v);
                },
                message: 'السعر يجب أن يكون رقماً موجباً وبحد أقصى منزلتين عشريتين',
            },
        },
        compareAtPrice: {
            type: Number,
            min: 0,
            default: null,
            validate: {
                validator: function (v) {
                    if (v === null || v === undefined) return true;
                    return isMoney(v);
                },
                message: 'سعر الخصم/المقارنة يجب أن يكون رقماً موجباً وبحد أقصى منزلتين عشريتين',
            },
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
            validate: {
                validator: function (v) {
                    return Number.isInteger(v) && v >= 0;
                },
                message: 'المخزون يجب أن يكون رقماً صحيحاً غير سالب',
            },
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
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

// الفهرس المركب لمنع تكرار نفس تركيبة الخصائص لنفس المنتج (مثلاً أحمر + L مرتين)
variantSchema.index({ productId: 1, attrKey: 1 }, { unique: true });

// الفهرس المركب لكود SKU: فريد على مستوى المتجر نفسه حصراً (Store-Scoped SKU)
variantSchema.index({ storeId: 1, sku: 1 }, { unique: true });

variantSchema.index({ productId: 1, price: 1 });
variantSchema.index({ productId: 1, stock: 1 });

// Pre-validate hook لحساب attrKey تصاعدياً ومحدداً بشكل حتمي (Deterministic AttrKey)
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
            .map(([k, v]) => [String(k).trim().toLowerCase(), String(v).trim()])
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
