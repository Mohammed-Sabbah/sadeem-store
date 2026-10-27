const router = require("express").Router()
const { ROLE } = require("../constants/enums")

// Controller
const {
    createWithdrawalRequest,
    approveWithdrawal,
    rejectWithdrawal
} = require("../controllers/withdrawal.controller")

// Schema
const { validateIdempotencyKey } = require("../schemas/walletSchema")
const {
    validateWithdrawalRequest,
    validateWithdrawalAction
} = require("../schemas/withdrawalSchema")

// Middlewares
const { authenticate, authorize } = require("../middleware/auth")

router.use(authenticate)

// Create Withdrawal - User
router.post('/',
    authorize(ROLE.USER),
    validateIdempotencyKey,
    validateWithdrawalRequest,
    createWithdrawalRequest
);

// Change Withdrawal Request - Admin
router.patch('/:id/approve',
    authorize(ROLE.ADMIN),
    validateIdempotencyKey,
    validateWithdrawalAction,
    approveWithdrawal
);

router.patch('/:id/reject',
    authorize(ROLE.ADMIN),
    validateIdempotencyKey,
    validateWithdrawalAction,
    rejectWithdrawal
);

module.exports = router