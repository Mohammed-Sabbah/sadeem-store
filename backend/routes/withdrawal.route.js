const router = require("express").Router()
const { ROLE } = require("../constants/enums")

// Controller
const {
    createWithdrawalRequest,
    approveWithdrawalRequest,
    rejectWithdrawalRequest
} = require("../controllers/withdrawal.controller")

// Schema
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
    validateWithdrawalRequest,
    createWithdrawalRequest
);

// Change Withdrawal Request - Admin
router.patch('/:id/approve',
    authorize(ROLE.ADMIN),
    validateWithdrawalAction,
    approveWithdrawalRequest
);

router.patch('/:id/reject',
    authorize(ROLE.ADMIN),
    validateWithdrawalAction,
    rejectWithdrawalRequest
);

module.exports = router