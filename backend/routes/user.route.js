const router = require("express").Router()

const { getMe, updateProfile } = require("../controllers/user.controller")
const { authenticate } = require("../middleware/auth")

router.use(authenticate)

router.get("/me", getMe)
router.patch("/profile", updateProfile)

module.exports = router