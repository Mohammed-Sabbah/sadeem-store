const router = require('express').Router();
const {
    getAllOptionDefinitions,
    getOptionsByCategory,
    createOptionDefinition,
    addValueToOption,
} = require('../controllers/optionDefinitionController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');

// Public endpoints for frontend selection
router.get('/', getAllOptionDefinitions);
router.get('/category/:categoryId', getOptionsByCategory);

// Admin-only endpoints for managing options & values
router.post('/', authenticate, authorize(ROLE.ADMIN), createOptionDefinition);
router.post('/:key/values', authenticate, authorize(ROLE.ADMIN), addValueToOption);

module.exports = router;
