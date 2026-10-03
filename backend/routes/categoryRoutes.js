const express = require('express');
const { createCategory } = require('../controllers/categoryController');
const { validateCategory } = require('../middleware/validateCategory');

const router = express.Router();

router.post('/', validateCategory, createCategory);

module.exports = router;
