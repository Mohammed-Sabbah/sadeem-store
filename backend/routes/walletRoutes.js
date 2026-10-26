const router = require('express').Router();
const {
    getWallet,
    getWalletTransactions,
    createDepositRequest,
    listTransactions,
    getWalletTransaction,
    cancelTransaction,
    approveDeposit,
    rejectDeposit,
    createWithdrawalRequest,
    approveWithdrawal,
    rejectWithdrawal,
} = require('../controllers/walletController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');
const upload = require('../middleware/upload');
const uploadToCloudinary = require('../middleware/uploadToCloudinary');

const {
    validateDepositRequest,
    validateDepositAction,
    validateDepositApproval,
    validateIdempotencyKey,
    validateWalletHistory,
    validateWalletTransactionFilters,
    validateWalletTransactionId,
    validateWithdrawalRequest,
    validateWithdrawalAction,
} = require('../schemas/walletSchema');
const imageFolder = 'proofImages';

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

// Create Deposit Transaction Request
router.post('/deposits',
    authorize(ROLE.USER),
    upload.single('proofImage'),
    validateIdempotencyKey,
    validateDepositRequest,
    uploadToCloudinary(imageFolder),
    createDepositRequest
);

// create Withdraw Transaction
router.post('/withdrawals',
    authorize(ROLE.USER),
    validateIdempotencyKey,
    validateWithdrawalRequest,
    createWithdrawalRequest
);

// Cancel Transaction Request
router.patch('/transactions/:id/cancel',
    authorize(ROLE.USER),
    validateIdempotencyKey,
    validateWalletTransactionId,
    cancelTransaction
);

// get Deposites Transactions
router.get('/transactions',
    authorize(ROLE.ADMIN),
    validateWalletTransactionFilters,
    listTransactions
);

// Change Deposit Request Status
router.patch('/deposits/:id/approve',
    authorize(ROLE.ADMIN),
    validateIdempotencyKey,
    validateDepositApproval,
    approveDeposit
);

router.patch('/deposits/:id/reject',
    authorize(ROLE.ADMIN),
    validateIdempotencyKey,
    validateDepositAction,
    rejectDeposit
);

// Change Withdraw Request Status
router.patch('/withdrawals/:id/approve',
    authorize(ROLE.ADMIN),
    validateIdempotencyKey,
    validateWithdrawalAction,
    approveWithdrawal
);

router.patch('/withdrawals/:id/reject',
    authorize(ROLE.ADMIN),
    validateIdempotencyKey,
    validateWithdrawalAction,
    rejectWithdrawal
);

module.exports = router;
