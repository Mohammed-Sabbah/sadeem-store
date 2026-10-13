const express = require('express');
const { ROLE } = require('../constants/enums');
const { authenticate, authorize } = require('../middleware/auth');
const {
    getAllCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategoryVariantAttribute,
    deleteCategory,
} = require('../controllers/categoryController');
const {
    validateCategory,
    validateCategorySlug,
    validateCategoryId,
    validateCategoryVariantAttribute,
} = require('../schemas/categorySchema');

const router = express.Router();

const adminOnly = [authenticate, authorize(ROLE.ADMIN)];

// Public Routes
router.get('/', getAllCategories);
router.get('/:slug', validateCategorySlug, getCategoryBySlug);

// Admin Routes
router.post('/', ...adminOnly, validateCategory(), createCategory);
router.patch('/:id', ...adminOnly, validateCategoryId, validateCategory(true), updateCategory);
router.delete('/:id/variant-attributes/:attributeName', ...adminOnly, validateCategoryVariantAttribute, deleteCategoryVariantAttribute);
router.delete('/:id', ...adminOnly, validateCategoryId, deleteCategory);

module.exports = router;
