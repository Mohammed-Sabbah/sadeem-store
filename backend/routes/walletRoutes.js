const router = require('express').Router();
const {
    getWallet,
    getWalletTransactions,
    createDepositRequest,
    listPendingDeposits,
    getDeposit,
    approveDeposit,
    rejectDeposit,
    createWithdrawalRequest,
    listPendingWithdrawals,
    getWithdrawal,
    approveWithdrawal,
    completeWithdrawal,
    rejectWithdrawal,
} = require('../controllers/walletController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');
const {
    validateDepositRequest,
    validateDepositAction,
    validateWalletHistory,
    validateWithdrawalRequest,
    validateWithdrawalAction,
} = require('../schemas/walletSchema');

// Get User Wallet. 
router.get('/', authenticate, getWallet);

// Get User Transactions
router.get('/transactions', authenticate, validateWalletHistory, getWalletTransactions);

// Create Deposite Transaction Request
router.post('/deposits', authenticate, authorize(ROLE.USER), validateDepositRequest, createDepositRequest);

// 
router.get('/deposits/pending', authenticate, authorize(ROLE.ADMIN), listPendingDeposits);

// Get Deposit Request by Id
router.get('/deposits/:id', authenticate, validateDepositAction, getDeposit);

// Change Deposit Request
router.post('/deposits/:id/approve', authenticate, authorize(ROLE.ADMIN), validateDepositAction, approveDeposit);
router.post('/deposits/:id/reject', authenticate, authorize(ROLE.ADMIN), validateDepositAction, rejectDeposit);

router.post('/withdrawals', authenticate, authorize(ROLE.USER), validateWithdrawalRequest, createWithdrawalRequest);
router.get('/withdrawals/pending', authenticate, authorize(ROLE.ADMIN), listPendingWithdrawals);
router.get('/withdrawals/:id', authenticate, validateWithdrawalAction, getWithdrawal);
router.post('/withdrawals/:id/approve', authenticate, authorize(ROLE.ADMIN), validateWithdrawalAction, approveWithdrawal);
router.post('/withdrawals/:id/complete', authenticate, authorize(ROLE.ADMIN), validateWithdrawalAction, completeWithdrawal);
router.post('/withdrawals/:id/reject', authenticate, authorize(ROLE.ADMIN), validateWithdrawalAction, rejectWithdrawal);

module.exports = router;
