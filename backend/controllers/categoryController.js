const Category = require('../models/Category');
const { success, error } = require('../utils/responses');

function slugify(text) {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0621-\u064A-]+/g, '')
        .replace(/--+/g, '-');
}

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
        const category = await Category.findOne({ slug: String(slug).toLowerCase().trim(), isActive: true }).lean();

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

        const categorySlug = slug ? slugify(slug) : slugify(title);

        const existingCategory = await Category.findOne({ slug: categorySlug });
        if (existingCategory) {
            return error(res, 409, 'Category with this slug already exists');
        }

        const category = await Category.create({
            title: String(title).trim(),
            slug: categorySlug,
            icon: icon || '',
            order: Number(order) || 0,
            topCategoryId: topCategoryId || null,
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
