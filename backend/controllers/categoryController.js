const Category = require('../models/Category');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const { success, error } = require('../utils/responses');
const { hasVariantAttributes, normalizeAttributes } = require('../utils/variant');
const {
    slugify,
    hasBreakingVariantAttributeChanges,
    mergeVariantAttributes,
    removeVariantAttribute,
} = require('../utils/category');

async function getVariantAttributeCompatibilityError(categoryId, definitions) {
    const productIds = await Product.distinct('_id', { categoryId });
    const variants = await Variant.find({
        productId: { $in: productIds },
        isDeleted: { $ne: true },
    }).lean();
    for (const variant of variants) {
        if (!hasVariantAttributes(variant.attributes)) continue;

        const attributeNames = new Set(
            (variant.attributes instanceof Map
                ? Array.from(variant.attributes.keys())
                : Object.keys(variant.attributes || {})
            ).map((name) => name.trim().toLowerCase())
        );
        const applicableDefinitions = definitions.filter((definition) =>
            attributeNames.has(definition.name.trim().toLowerCase())
        );
        const result = normalizeAttributes(variant.attributes, applicableDefinitions);
        if (result.error) return result.error;
    }

    return null;
}

async function getAllCategories(req, res, next) {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ title: 1 })
            .lean();

        return success(res, 200, {
            categories,
            count: categories.length,
        });
    } catch (err) {
        return next(err);
    }
}

async function getCategoryBySlug(req, res, next) {
    try {
        const { slug } = req.params;
        const category = await Category.findOne({ slug, isActive: true }).lean();

        if (!category) {
            return error(res, 404, 'Category not found');
        }

        return success(res, 200, {
            category,
        });
    } catch (err) {
        return next(err);
    }
}

async function createCategory(req, res, next) {
    try {
        const { title, variantAttributes } = req.body;
        const slug = slugify(title);

        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            return error(res, 409, 'Category with this slug already exists');
        }

        const category = await Category.create({
            title,
            slug,
            variantAttributes,
            isActive: true,
        });

        return success(res, 201, {
            message: 'Category created successfully',
            category,
        });
    } catch (err) {
        return next(err);
    }
}

async function updateCategory(req, res, next) {
    try {
        const { id } = req.params;
        const { title, variantAttributes, isActive } = req.body;
        const updates = {};

        if (title !== undefined) {
            updates.title = title;
        }
        if (isActive !== undefined) updates.isActive = isActive;

        if (variantAttributes !== undefined) {
            const currentCategory = await Category.findById(id).select('variantAttributes').lean();
            if (!currentCategory) {
                return error(res, 404, 'Category not found');
            }

            const mergedDefinitions = mergeVariantAttributes(
                currentCategory.variantAttributes,
                variantAttributes
            );

            if (mergedDefinitions.length > 20) {
                return error(res, 400, 'A category can have at most 20 variant attributes');
            }

            updates.variantAttributes = mergedDefinitions;

            // only if the existed attributes are changed, we need to check if any existing product variants are incompatible with the new definitions, when the admin add new attribute -> we can skip this step
            if (hasBreakingVariantAttributeChanges(currentCategory.variantAttributes, updates.variantAttributes)) {
                const compatibilityError = await getVariantAttributeCompatibilityError(
                    id,
                    updates.variantAttributes
                );
                if (compatibilityError) {
                    return error(
                        res,
                        409,
                        `Category attributes cannot be changed because an existing product variant is incompatible: ${compatibilityError}`
                    );
                }
            }
        }

        const category = await Category.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!category) {
            return error(res, 404, 'Category not found');
        }

        return success(res, 200, {
            message: 'Category updated successfully',
            category,
        });
    } catch (err) {
        return next(err);
    }
}

async function deleteCategoryVariantAttribute(req, res, next) {
    try {
        const { id, attributeName } = req.params;
        const currentCategory = await Category.findById(id).select('variantAttributes');
        if (!currentCategory) {
            return error(res, 404, 'Category not found');
        }

        const updatedDefinitions = removeVariantAttribute(
            currentCategory.variantAttributes,
            attributeName
        );
        if (updatedDefinitions.length === currentCategory.variantAttributes.length) {
            return error(res, 404, 'Variant attribute not found');
        }

        if (hasBreakingVariantAttributeChanges(currentCategory.variantAttributes, updatedDefinitions)) {
            const compatibilityError = await getVariantAttributeCompatibilityError(id, updatedDefinitions);
            if (compatibilityError) {
                return error(
                    res,
                    409,
                    `Category attributes cannot be changed because an existing product variant is incompatible: ${compatibilityError}`
                );
            }
        }

        currentCategory.variantAttributes = updatedDefinitions;
        await currentCategory.save();

        return success(res, 200, {
            message: 'Variant attribute deleted successfully',
            category: currentCategory,
        });
    } catch (err) {
        return next(err);
    }
}

async function deleteCategory(req, res, next) {
    try {
        const { id } = req.params;
        const hasProducts = await Product.exists({ categoryId: id, isDeleted: false });
        if (hasProducts) {
            return error(res, 409, 'Category cannot be deleted while it has products');
        }

        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return error(res, 404, 'Category not found');
        }

        return success(res, 200, {
            message: 'Category deleted successfully',
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getAllCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategoryVariantAttribute,
    deleteCategory,
};
