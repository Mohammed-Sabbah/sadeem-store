const router = require('express').Router();
const {
    getWallet,
    getWalletTransactions,
    createDepositRequest,
    listTransactions,
    getWalletTransaction,
    cancelTransaction,
    completeDeposit,
    rejectDeposit,
    createWithdrawalRequest,
    approveWithdrawal,
    completeWithdrawal,
    rejectWithdrawal,
} = require('../controllers/walletController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');

// const upload = require("../middleware/upload")
// const uploadToCloudinary = require("../middleware/uploadToCloudinary")

const {
    validateDepositRequest,
    validateDepositAction,
    validateWalletHistory,
    validateWalletTransactionFilters,
    validateWalletTransactionId,
    validateWithdrawalRequest,
    validateWithdrawalAction,
} = require('../schemas/walletSchema');
const imageFolder = "proofImages"

router.use(authenticate)
router.use(authorize(ROLE.USER))
// User Routes

// Get User Wallet
router.get('/', getWallet);

// Get User Transactions
router.get('/user/transactions',
    validateWalletHistory,
    getWalletTransactions
);

// Get Transaction by Id
router.get('/transactions/:id',
    validateWalletTransactionId,
    getWalletTransaction
);

// Create Deposite Transaction Request
router.post('/deposits',
    validateDepositRequest,
    createDepositRequest
);

// create Withdraw Transaction
router.post('/withdrawals',
    validateWithdrawalRequest,
    createWithdrawalRequest
);

// Cancel Transaction Request
router.patch('/transactions/:id/cancel',
    validateWalletTransactionId,
    cancelTransaction
);

// Admin Routes
router.use(authorize(ROLE.ADMIN));

// get Deposites Transactions
router.get('/transactions',
    validateWalletTransactionFilters,
    listTransactions
);

// Change Deposit Request Status
router.patch('/deposits/:id/complete',
    validateDepositAction,
    completeDeposit
);

router.patch('/deposits/:id/reject',
    validateDepositAction,
    rejectDeposit
);

// Change Withdraw Request Status
router.patch('/withdrawals/:id/approve',
    validateWithdrawalAction,
    approveWithdrawal
);

router.patch('/withdrawals/:id/complete',
    validateWithdrawalAction,
    completeWithdrawal
);

router.patch('/withdrawals/:id/reject',
    validateWithdrawalAction,
    rejectWithdrawal
);

module.exports = router;
