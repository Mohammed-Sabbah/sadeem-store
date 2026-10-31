const { listOrders, listOrder, createOrder } = require("../services/order.service")
const { success } = require("../utils/responses")

const getOrders = async (req, res, next) => {
    try {
        const orders = await listOrders({ ...req.query, actor: req.user })
        return success(res, 200, { orders })
    } catch (err) {
        next(err)
    }
}

const getOrderById = async (req, res, next) => {
    try {
        const order = await listOrder({ storeId: req.store?._id, orderId: req.params.id, actor: req.user })
        return success(res, 200, { order })
    } catch (err) {
        next(err)
    }
}

const getStoreOrders = async (req, res, next) => {
    try {
        const orders = await listOrders({ ...req.query, storeId: req.store._id, actor: req.user })
        return success(res, 200, { orders })
    } catch (err) {
        next(err)
    }
}

const placeOrder = async (req, res, next) => {
    try {
        const order = await createOrder({
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

module.exports = {
    getOrders,
    getOrderById,
    getStoreOrders,
    placeOrder
}