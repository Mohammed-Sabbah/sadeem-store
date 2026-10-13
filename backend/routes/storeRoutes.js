const router = require('express').Router();
const {
    getMyStore,
    toggleMyStoreStatus,
    getStoreById,
    approveStore,
} = require('../controllers/storeController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');
const { validateStoreId } = require('../schemas/storeSchema');

const sellerOnly = [authenticate, authorize(ROLE.SELLER)];
const adminOnly = [authenticate, authorize(ROLE.ADMIN)];

// Seller Store Profile Routes
router.get('/me', ...sellerOnly, getMyStore);
router.patch('/me/status', ...sellerOnly, toggleMyStoreStatus);

// Public Store Route
router.get('/:id', validateStoreId, getStoreById);

// Admin Store Route
router.patch('/:id/approve', ...adminOnly, validateStoreId, approveStore);

module.exports = router;
