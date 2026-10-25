const express = require('express');
const { ROLE } = require('../constants/enums');

// Middlewares
const { authenticate, authorize } = require('../middleware/auth');

// Controllers
const {
    getAllCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategoryVariantAttribute,
    deleteCategory,
} = require('../controllers/categoryController');

// Validators
const {
    validateCategory,
    validateCategorySlug,
    validateCategoryId,
    validateCategoryVariantAttribute,
} = require('../schemas/categorySchema');

// Router
const router = express.Router();

// Get All Categories
router.get('/', getAllCategories);

// Get Category By Slug
router.get('/:slug', validateCategorySlug, getCategoryBySlug);

// Create Category - Admin
router.post('/', authenticate, authorize(ROLE.ADMIN), validateCategory(), createCategory);

// Update Category - Admin
router.patch(
    '/:id',
    authenticate,
    authorize(ROLE.ADMIN),
    validateCategoryId,
    validateCategory(true),
    updateCategory
);

// Delete Category Variant Attribute - Admin
router.delete(
    '/:id/variant-attributes/:attributeKey',
    authenticate,
    authorize(ROLE.ADMIN),
    validateCategoryVariantAttribute,
    deleteCategoryVariantAttribute
);

// Delete Category - Admin
router.delete('/:id', authenticate, authorize(ROLE.ADMIN), validateCategoryId, deleteCategory);

module.exports = router;
