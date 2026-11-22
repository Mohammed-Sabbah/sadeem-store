const router = require('express').Router();
const {
    getWallet,
} = require('../controllers/walletController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');

router.use(authenticate);

// Get User Wallet
router.get('/', authorize(ROLE.USER), getWallet);

module.exports = router;
