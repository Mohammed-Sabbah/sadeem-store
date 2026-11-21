const router = require("express").Router()
const { ROLE } = require("../constants/enums")
const {
    createCollectingDeliveryTask,
    createFinalDeliveryTask,
    completeCollectingDeliveryTask,
    completeFinalDeliveryTask,

} = require("../controllers/delivery.controller")

const { authenticate, authorize } = require("../middleware/auth")

router.use(authenticate)

// Driver Routes
router.patch("/collecting/:id/complete", authorize(ROLE.DRIVER), completeCollectingDeliveryTask)
router.patch("/final/:id/complete", authorize(ROLE.DRIVER), completeFinalDeliveryTask)

// Admin Routes
router.use(authorize(ROLE.ADMIN))

router.post("/collecting", createCollectingDeliveryTask)
router.post("/final", createFinalDeliveryTask)


module.exports = router