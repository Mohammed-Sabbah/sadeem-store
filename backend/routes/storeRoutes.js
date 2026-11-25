const router = require('express').Router();
const {
    approveStore,
    getPublicStore,
    getPublicStores,
    getMyStore,
    getMyStoreBalance,
    getStoreBalance,
    createStorePayout,
    getAdminStores,
    toggleStoreStatus,
    rejectStore,
} = require('../controllers/storeController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');
const { validateStoreId, validateCreateStorePayout } = require('../schemas/storeSchema');

router.get("/me", authenticate, authorize(ROLE.SELLER), getMyStore)
router.get("/me/balance", authenticate, authorize(ROLE.SELLER), getMyStoreBalance)
router.get('/', getPublicStores);
router.get('/admin', authenticate, authorize(ROLE.ADMIN), getAdminStores);
router.get('/:id/balance', authenticate, authorize(ROLE.ADMIN), validateStoreId, getStoreBalance);
router.post('/:id/payouts', authenticate, authorize(ROLE.ADMIN), validateCreateStorePayout, createStorePayout);
router.get('/:id', validateStoreId, getPublicStore);
router.patch('/:id/approve', authenticate, authorize(ROLE.ADMIN), validateStoreId, approveStore);
router.patch('/:id/reject', authenticate, authorize(ROLE.ADMIN), validateStoreId, rejectStore);
router.patch('/:id/toggle-status', authenticate, authorize(ROLE.ADMIN), validateStoreId, toggleStoreStatus);

module.exports = router;
