const router = require('express').Router();
const {
  getPendingMerchants,
  approveMerchant,
  rejectMerchant,
  getPublicMerchants,
} = require('../controllers/merchant.controller');
const verifyToken = require('../middlewares/verifyToken');
const allowedTo = require('../middlewares/allowedTo');

// Public directory of approved merchants
router.get('/', getPublicMerchants);

// Admin-only approval endpoints
router.get('/pending', verifyToken, allowedTo('admin'), getPendingMerchants);
router.patch('/:id/approve', verifyToken, allowedTo('admin'), approveMerchant);
router.patch('/:id/reject', verifyToken, allowedTo('admin'), rejectMerchant);

module.exports = router;
