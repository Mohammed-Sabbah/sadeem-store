const router = require("express").Router()
const { ROLE } = require("../constants/enums")

const allowAll = [ROLE.ADMIN, ROLE.SELLER, ROLE.USER]

// Controller
const {
    getOrders,
    getOrderById,
    calculateOrderTotal,
    getStoreOrders,
    placeOrder,
    cancelOrder,
    cancelOrderItem
} = require("../controllers/order.controller")

// Middlewares
const { authenticate, authorize } = require("../middleware/auth")
router.use(authenticate)

// Schema
const {
    validateOrderId,
    validateListOrders,
    validateCreateOrder,
    validateCalculateOrderTotal,
    validateCancelOrderItemStatus
} = require("../schemas/orderSchema")

// Get User Orders
router.get("/", authorize(ROLE.USER), validateListOrders, getOrders)

// get Store Orders
router.get("/store", authorize(ROLE.SELLER), validateListOrders, getStoreOrders)

// Get Admin Orders
router.get("/admin", authorize(ROLE.ADMIN), validateListOrders, getOrders)

// Calculate the amount due without creating or charging an order
router.post(
    "/calculate-total",
    authorize(ROLE.USER),
    validateCalculateOrderTotal,
    calculateOrderTotal
)

// Get Order By Id
router.get("/:id", authorize(...allowAll), validateOrderId, getOrderById)

// Create Order
router.post("/", authorize(ROLE.USER), validateCreateOrder, placeOrder)

// Cancel Order
router.patch("/:id/cancel",
    authorize(ROLE.ADMIN, ROLE.USER),
    validateOrderId,
    cancelOrder
)

// cancel order item
router.patch("/:orderId/items/:itemId/cancel",
    authorize(ROLE.SELLER),
    validateCancelOrderItemStatus,
    cancelOrderItem
)

module.exports = router