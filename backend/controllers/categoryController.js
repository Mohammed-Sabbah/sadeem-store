const Category = require('../models/Category');
const { success, error } = require('../utils/responses');

async function getAllCategories(req, res, next) {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ order: 1, createdAt: 1 })
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
        const { title, slug, icon, order, topCategoryId } = req.body;

        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            return error(res, 409, 'Category with this slug already exists');
        }

        const category = await Category.create({
            title,
            slug,
            icon,
            order,
            topCategoryId,
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

module.exports = {
    getAllCategories,
    getCategoryBySlug,
    createCategory,
};
