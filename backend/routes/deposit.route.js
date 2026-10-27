const router = require("express").Router()
const { ROLE } = require("../constants/enums")
const imageFolder = "proofImages"

// Controller
const {
    createDepositRequest,
    approveDepositRequest,
    rejectDepositRequest
} = require("../controllers/deposit.controller")

// Schema
// const { validateIdempotencyKey } = require("../schemas/walletSchema")
const {
    validateDepositRequest,
    validateDepositApproval,
    validateDepositAction
} = require("../schemas/depositSchema")

// Middlewares
const { authenticate, authorize } = require("../middleware/auth")
const upload = require("../middleware/upload")
const uploadToCloudinary = require("../middleware/uploadToCloudinary")

router.use(authenticate)

// Create Deposit Transaction Request - User
router.post('/',
    authorize(ROLE.USER),
    upload.single('proofImage'),
    // validateIdempotencyKey,
    validateDepositRequest,
    uploadToCloudinary(imageFolder),
    createDepositRequest
);

// Change Deposit Request Status - Admin
router.patch('/:id/approve',
    authorize(ROLE.ADMIN),
    // validateIdempotencyKey,
    validateDepositApproval,
    approveDepositRequest
);

router.patch('/:id/reject',
    authorize(ROLE.ADMIN),
    // validateIdempotencyKey,
    validateDepositAction,
    rejectDepositRequest
);

module.exports = router