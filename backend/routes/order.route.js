const router = require("express").Router()
const { ROLE } = require("../constants/enums")

// Controller
const {
    getOrders,
    getOrderById,
    getStoreOrders,
    placeOrder,
    cancelOrder
} = require("../controllers/order.controller")

// Middlewares
const { authenticate, authorize } = require("../middleware/auth")
router.use(authenticate)

// Schema
const { validateOrderId, validateListOrders, validateCreateOrder } = require("../schemas/orderSchema")

// Get User Orders
router.get("/", authorize(ROLE.USER), validateListOrders, getOrders)

// get Store Orders
router.get("/store", authorize(ROLE.SELLER), validateListOrders, getStoreOrders)

// Get Admin Orders
router.get("/admin", authorize(ROLE.ADMIN), validateListOrders, getOrders)

// Get Order By Id
router.get("/:id", validateOrderId, getOrderById)

// Create Order
router.post("/", authorize(ROLE.USER), validateCreateOrder, placeOrder)

// Cancel Order
router.patch("/:id/cancel", authorize(ROLE.USER), validateOrderId, cancelOrder)

module.exports = router