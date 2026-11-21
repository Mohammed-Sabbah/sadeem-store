const deliveryService = require("../services/delivery.service")
const { success } = require("../utils/responses")

const getDeliveryTasks = async (req, res, next) => {
    try {
        const deliveryTasks = await deliveryService.getDeliveryTasks(req.user)
        return success(res, 200, { deliveryTasks })
    } catch (err) {
        next(err)
    }
}

const getDeliveryTask = async (req, res, next) => {
    try {
        const deliveryTask = await deliveryService.getDeliveryTask({
            deliveryTaskId: req.params.id,
            actor: req.user
        })
        return success(res, 200, { deliveryTask })
    } catch (err) {
        next(err)
    }
}

const cancelDeliveryTask = async (req, res, next) => {
    try {
        const deliveryTask = await deliveryService.cancelDeliveryTask(req.params.id)
        return success(res, 200, { deliveryTask })
    } catch (err) {
        next(err)
    }
}

const createCollectingDeliveryTask = async (req, res, next) => {
    try {
        const deliveryTask = await deliveryService.createCollectingDelivery({
            orderIds: req.body.orderIds,
            driverId: req.body.driverId,
            amount: req.body.amount,
            deliveryLocation: req.body.deliveryLocation,
            adminId: req.user._id
        });

        return success(res, 201, { deliveryTask });
    } catch (err) {
        next(err);
    }
};

const createFinalDeliveryTask = async (req, res, next) => {
    try {
        const deliveryTask = await deliveryService.createFinalDelivery({
            orderGroupId: req.body.orderGroupId,
            driverId: req.body.driverId,
            amount: req.body.amount,
            pickupLocation: req.body.pickupLocation,
            adminId: req.user._id
        });

        return success(res, 201, { deliveryTask });
    } catch (err) {
        next(err);
    }
};

const completeCollectingDeliveryTask = async (req, res, next) => {
    try {
        const deliveryTask = await deliveryService.completeCollectingDelivery({
            driverId: req.user._id,
            deliveryTaskId: req.params.id
        })
        return success(res, 200, { deliveryTask })
    } catch (err) {
        next(err)
    }
}

const completeFinalDeliveryTask = async (req, res, next) => {
    try {
        const deliveryTask = await deliveryService.completeFinalDelivery({
            driverId: req.user._id,
            deliveryTaskId: req.params.id
        })
        return success(res, 200, { deliveryTask })
    } catch (err) {
        next(err)
    }
}

module.exports = {
    getDeliveryTasks,
    getDeliveryTask,
    cancelDeliveryTask,
    createCollectingDeliveryTask,
    createFinalDeliveryTask,
    completeCollectingDeliveryTask,
    completeFinalDeliveryTask
}