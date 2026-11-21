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

} = require("../controllers/delivery.controller")

const { authenticate, authorize } = require("../middleware/auth")
const { validateDeliveryTaskId } = require("../schemas/deliverySchema")

router.use(authenticate)

// Delivery task reads
router.get("/", authorize(ROLE.ADMIN, ROLE.DRIVER), getDeliveryTasks)
router.get("/:id", authorize(ROLE.ADMIN, ROLE.DRIVER), validateDeliveryTaskId, getDeliveryTask)

// Driver Routes
router.patch("/collecting/:id/complete", authorize(ROLE.DRIVER), completeCollectingDeliveryTask)
router.patch("/final/:id/complete", authorize(ROLE.DRIVER), completeFinalDeliveryTask)

// Admin Routes
router.use(authorize(ROLE.ADMIN))

router.patch("/:id/cancel", validateDeliveryTaskId, cancelDeliveryTask)
router.post("/collecting", createCollectingDeliveryTask)
router.post("/final", createFinalDeliveryTask)


module.exports = router