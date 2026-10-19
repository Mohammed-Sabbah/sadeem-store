const router = require('express').Router();
const { approveStore, getPublicStore } = require('../controllers/storeController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');
const { validateStoreId } = require('../schemas/storeSchema');

router.get("/me", authenticate, authorize(ROLE.SELLER), getMyStore)
router.get('/:id', validateStoreId, getPublicStore);
router.patch('/:id/approve', authenticate, authorize(ROLE.ADMIN), validateStoreId, approveStore);

module.exports = router;
