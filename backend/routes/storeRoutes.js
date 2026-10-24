const router = require('express').Router();
const {
    approveStore,
    getPublicStore,
    getMyStore,
    getAdminStores,
    toggleStoreStatus,
    rejectStore,
} = require('../controllers/storeController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');
const { validateStoreId } = require('../schemas/storeSchema');

router.get("/me", authenticate, authorize(ROLE.SELLER), getMyStore)
router.get('/admin', authenticate, authorize(ROLE.ADMIN), getAdminStores);
router.get('/:id', validateStoreId, getPublicStore);
router.patch('/:id/approve', authenticate, authorize(ROLE.ADMIN), validateStoreId, approveStore);
router.patch('/:id/reject', authenticate, authorize(ROLE.ADMIN), validateStoreId, rejectStore);
router.patch('/:id/toggle-status', authenticate, authorize(ROLE.ADMIN), validateStoreId, toggleStoreStatus);

module.exports = router;
