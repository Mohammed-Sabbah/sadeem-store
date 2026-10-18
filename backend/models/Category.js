const mongoose = require('mongoose');

const variantAttributeSchema = new mongoose.Schema(
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
        variantAttributes: {
            type: [variantAttributeSchema],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
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
