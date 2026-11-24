const router = require("express").Router()
const { ROLE } = require("../constants/enums")
const {
    createCollectingDeliveryTask,
    createFinalDeliveryTask,
    completeCollectingDeliveryTask,
    completeFinalDeliveryTask,
    getDeliveryTasks,
    getDeliveryTask,
    cancelDeliveryTask,
    createDriverPayout,
    getMyBalance,
    getDriverBalance,

} = require("../controllers/delivery.controller")

const { authenticate, authorize } = require("../middleware/auth")
const {
    validateDeliveryTaskId,
    validateCreateCollectingDeliveryTask,
    validateCreateFinalDeliveryTask,
    validateDriverId,
    validateCreateDriverPayout
} = require("../schemas/deliverySchema")

router.use(authenticate)

// Driver Routes
router.patch("/collecting/:id/complete",
    authorize(ROLE.DRIVER),
    validateDeliveryTaskId,
    completeCollectingDeliveryTask
)
router.patch("/final/:id/complete",
    authorize(ROLE.DRIVER),
    validateDeliveryTaskId,
    completeFinalDeliveryTask
)
router.get("/my-balance", authorize(ROLE.DRIVER), getMyBalance)

// Delivery task reads
router.get("/", authorize(ROLE.ADMIN, ROLE.DRIVER), getDeliveryTasks)
router.get("/:id", authorize(ROLE.ADMIN, ROLE.DRIVER), validateDeliveryTaskId, getDeliveryTask)

// Admin Routes
router.use(authorize(ROLE.ADMIN))

router.patch("/:id/cancel", validateDeliveryTaskId, cancelDeliveryTask)
router.post("/collecting", validateCreateCollectingDeliveryTask, createCollectingDeliveryTask)
router.post("/final", validateCreateFinalDeliveryTask, createFinalDeliveryTask)
router.post("/driver/:id/payouts", validateCreateDriverPayout, createDriverPayout)
router.get("/driver/:id/balance", validateDriverId, getDriverBalance)

module.exports = router