const router = require('express').Router();
const {
    getWallet,
    getWalletTransactions,
    listTransactions,
    getWalletTransaction,
    cancelTransaction,
} = require('../controllers/walletController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');

const {
    validateIdempotencyKey,
    validateWalletHistory,
    validateWalletTransactionFilters,
    validateWalletTransactionId,
} = require('../schemas/walletSchema');

router.use(authenticate);

// Get User Wallet
router.get('/', authorize(ROLE.USER), getWallet);

// Get User Transactions
router.get('/user/transactions',
    authorize(ROLE.USER),
    validateWalletHistory,
    getWalletTransactions
);

// Get Transaction by Id
router.get('/transactions/:id',
    authorize(ROLE.USER, ROLE.ADMIN),
    validateWalletTransactionId,
    getWalletTransaction
);

// Cancel Transaction Request
router.patch('/transactions/:id/cancel',
    authorize(ROLE.USER),
    validateWalletTransactionId,
    cancelTransaction
);

// List Transactions
router.get('/transactions',
    authorize(ROLE.ADMIN),
    validateWalletTransactionFilters,
    listTransactions
);

module.exports = router;
