const router = require("express").Router()

const { getMe } = require("../controllers/user.controller")
const { authenticate } = require("../middleware/auth")

router.use(authenticate)

router.get("/me", getMe)

module.exports = router