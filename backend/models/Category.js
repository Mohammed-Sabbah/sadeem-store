const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        icon: {
            type: String,
            default: '',
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        topCategoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        allowedOptions: {
            type: [String],
            default: [],
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

/**
 * دالة استرجاع الخيارات المسموحة للتصنيف مع دعم التوريث من التصنيف الأب (Top Category Inheritance)
 */
categorySchema.statics.resolveAllowedOptions = async function (categoryId) {
    if (!categoryId) return [];
    const cat = await this.findById(categoryId).lean();
    if (!cat) return [];

    if (Array.isArray(cat.allowedOptions) && cat.allowedOptions.length > 0) {
        return cat.allowedOptions;
    }

    if (cat.topCategoryId) {
        const topCat = await this.findById(cat.topCategoryId).lean();
        if (topCat && Array.isArray(topCat.allowedOptions)) {
            return topCat.allowedOptions;
        }
    }

    return [];
};

module.exports = mongoose.model('Category', categorySchema);
