const router = require('express').Router();
const { approveStore } = require('../controllers/storeController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');
const { validateStoreId } = require('../schemas/storeSchema');

router.patch('/:id/approve', authenticate, authorize(ROLE.ADMIN), validateStoreId, approveStore);

module.exports = router;
