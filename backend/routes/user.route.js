const router = require("express").Router()
const { ROLE } = require("../constants/enums")
const {
    getMe,
    updateProfile,
    createDriver,
    listUsers,
    listUser,
    changeUserStatus,
    changeDriverStatus
} = require("../controllers/user.controller")
const { authenticate, authorize } = require("../middleware/auth")
const { validateCreateDriver, validateListUsers } = require("../schemas/userSchema")

router.use(authenticate)

router.get("/me", getMe)
router.patch("/profile", updateProfile)

router.use(authorize(ROLE.ADMIN))
router.get("/", validateListUsers, listUsers)
router.post("/driver", validateCreateDriver, createDriver)
router.get("/:id", listUser)
router.patch("/user/:id/status", changeUserStatus)
router.patch("/driver/:id/status", changeDriverStatus)

module.exports = router