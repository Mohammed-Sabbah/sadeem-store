const express = require('express');
const {
    getAllCategories,
    getCategoryBySlug,
    createCategory,
} = require('../controllers/categoryController');
const { validateCategory, validateCategorySlug } = require('../schemas/categorySchema');

const router = express.Router();

router.get('/', getAllCategories);
router.get('/:slug', validateCategorySlug, getCategoryBySlug);
router.post('/', validateCategory, createCategory);

module.exports = router;
