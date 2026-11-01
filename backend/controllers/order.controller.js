const orderService = require("../services/order.service")
const { success } = require("../utils/responses")

const getOrders = async (req, res, next) => {
    try {
        const orders = await orderService.listOrders({ ...req.query, actor: req.user })
        return success(res, 200, { orders })
    } catch (err) {
        next(err)
    }
}

const getOrderById = async (req, res, next) => {
    try {
        const order = await orderService.listOrder({ storeId: req.store?._id, orderId: req.params.id, actor: req.user })
        return success(res, 200, { order })
    } catch (err) {
        next(err)
    }
}

const getStoreOrders = async (req, res, next) => {
    try {
        const orders = await orderService.listOrders({ ...req.query, storeId: req.store._id, actor: req.user })
        return success(res, 200, { orders })
    } catch (err) {
        next(err)
    }
}

const placeOrder = async (req, res, next) => {
    try {
        const order = await orderService.createOrder({
            userId: req.user._id,
            items: req.body.items,
            deliveryAddress: req.body.deliveryAddress,
            deliveryPhone: req.body.deliveryPhone,
            paymentMethod: req.body.paymentMethod
        })
        return success(res, 201, { order })
    } catch (err) {
        next(err)
    }
}

const cancelOrder = async (req, res, next) => {
    try {
        const order = await orderService.cancelOrder({ user: req.user, orderId: req.params.id })
        return success(res, 200, { order })
    } catch (err) {
        next(err)
    }
}

module.exports = {
    getOrders,
    getOrderById,
    getStoreOrders,
    placeOrder,
    cancelOrder
}