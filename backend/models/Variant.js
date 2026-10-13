const mongoose = require('mongoose');
const { STATUS, STATUS_VALUES, APPROVE_STATUS, APPROVE_STATUS_VALUES } = require('../constants/enums');
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
        image: {
            type: String,
            default: '',
            trim: true,
        },
        images: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: STATUS_VALUES,
            default: STATUS.ACTIVE,
            index: true,
        },
        approveStatus: {
            type: String,
            enum: APPROVE_STATUS_VALUES,
            default: APPROVE_STATUS.APPROVED,
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

// الفهرس المركب لمنع تكرار نفس تركيبة الخصائص لنفس المنتج (فقط للأصناف غير المحذوفة)
variantSchema.index(
    { productId: 1, attrKey: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

// الفهرس المركب لكود SKU: فريد على مستوى المتجر نفسه حصراً (Store-Scoped SKU للأصناف غير المحذوفة)
variantSchema.index(
    { storeId: 1, sku: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

variantSchema.index({ productId: 1, price: 1 });
variantSchema.index({ productId: 1, stock: 1 });
variantSchema.index({ productId: 1, status: 1, approveStatus: 1, isDeleted: 1 });

// Pre-validate hook لحساب attrKey تصاعدياً ومحدداً بشكل حتمي ومزامنة الصور والحالة
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

    if (Array.isArray(this.images) && this.images.length > 0 && !this.image) {
        this.image = this.images[0];
    } else if (this.image && (!Array.isArray(this.images) || this.images.length === 0)) {
        this.images = [this.image];
    }

    if (this.status) {
        this.isActive = this.status === STATUS.ACTIVE;
    } else if (this.isActive !== undefined) {
        this.status = this.isActive ? STATUS.ACTIVE : STATUS.IN_ACTIVE;
    }

    next();
});

module.exports = mongoose.model('Variant', variantSchema);
