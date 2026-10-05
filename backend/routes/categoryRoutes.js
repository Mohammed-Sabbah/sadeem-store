const express = require('express');
const {
    getAllCategories,
    getCategoryBySlug,
    createCategory,
} = require('../controllers/categoryController');
const { validateCategory } = require('../middleware/validateCategory');

const router = express.Router();

router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);
router.post('/', validateCategory, createCategory);

module.exports = router;
