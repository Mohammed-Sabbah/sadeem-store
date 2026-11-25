const router = require("express").Router()
const { authenticate, authorize } = require("../middleware/auth")
const { ROLE } = require("../constants/enums")

const {
    getTransactions,
    getTransaction,
    listTransactions,
    cancelTransaction,
} = require('../controllers/transaction.controller');

const {
    validateHistory,
    validateTransactionFilters,
    validateTransactionId,
} = require('../schemas/transactionSchema');

router.use(authenticate)

// Get User Transactions
router.get('/user',
    validateHistory,
    getTransactions
);

// Cancel Transaction Request
router.patch('/:id/cancel',
    authorize(ROLE.USER),
    validateTransactionId,
    cancelTransaction
);

// List All Transactions - Admin
router.get('/admin',
    authorize(ROLE.ADMIN),
    validateTransactionFilters,
    listTransactions
);

// Get Transaction by Id
router.get('/:id',
    validateTransactionId,
    getTransaction
);

module.exports = router