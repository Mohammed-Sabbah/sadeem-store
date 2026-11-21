const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/order.model");
const Region = require("../models/Region");
const Delivery = require("../models/delivery.model");
const OrderGroup = require("../models/OrderGroup.model");
const { RATE_PER_KM, STORE_FEE } = require("../constants/delivery");
const { roundMoney } = require("../utils/wallet");
const { divideByRegion } = require("../utils/order");
const { getFarthestPoint, normalizePoint } = require("./gps.service");
const { ORDER_STATUS, ROLE, STATUS, DELIVERY_STATUS, DELIVERY_TYPE } = require("../constants/enums");
const error = require("../utils/error");

const resolveUserPoint = async (address) => {
    const coordinates = address?.coordinates;
    const hasLatitude = coordinates?.lat !== undefined &&
        coordinates?.lat !== null && coordinates?.lat !== "";
    const hasLongitude = coordinates?.lng !== undefined &&
        coordinates?.lng !== null && coordinates?.lng !== "";

    if (hasLatitude || hasLongitude) {
        if (!hasLatitude || !hasLongitude) {
            throw error("User address coordinates must include latitude and longitude", 400);
        }

        return normalizePoint(coordinates, "User address");
    }

    const { region, city } = address || {};
    if (!region || !city) {
        throw error("User address must include a region and city", 400);
    }

    const regionRecord = await Region.findOne({
        id: region,
        "cities.id": city
    })
        .select("cities")
        .lean();
    const cityRecord = regionRecord?.cities?.find(item => item.id === city);

    if (!cityRecord?.center) {
        throw error("User address city center was not found", 400);
    }

    return normalizePoint(cityRecord.center, "User city center");
};

const calculateDeliveryFee = async (storesOrders, address) => {
    if (!Array.isArray(storesOrders)) {
        throw new TypeError("stores orders must be an array");
    }

    // divide store orders by region
    const regionsOrders = divideByRegion(storesOrders)

    if (regionsOrders.length === 0) {
        return 0;
    }

    const addressPoint = await resolveUserPoint(address);
    const regions = regionsOrders.map(regionOrder => {
        if (!Array.isArray(regionOrder.orders)) {
            throw new TypeError("Each region order must contain an orders array");
        }

        if (regionOrder.orders.length === 0) {
            return {
                region: regionOrder.region,
                storeCount: 0,
                farthestDistanceKm: 0,
                deliveryFee: 0
            };
        }

        const storePoints = regionOrder.orders.map(order => ({
            ...normalizePoint(order?.storePoint || order?.storeId?.address?.coordinates, "Store address"),
            storeId: order.storeId
        }));
        const farthestStore = getFarthestPoint(addressPoint, storePoints);
        const distanceFee = farthestStore.distance * RATE_PER_KM;
        const additionalStoresCount = Math.max(0, regionOrder.orders.length - 1);
        const storesFee = additionalStoresCount * STORE_FEE;
        const deliveryFee = roundMoney(distanceFee + storesFee);

        return {
            region: regionOrder.region,
            storeCount: regionOrder.orders.length,
            farthestDistanceKm: roundMoney(farthestStore.distance),
            deliveryFee
        };
    });

    const totalFee = roundMoney(
        regions.reduce((total, region) => total + region.deliveryFee, 0)
    );

    return totalFee;
};

const validateOrdersAvalilability = async (ids, session) => {
    const uniqueIds = [...new Set(ids.map(id => id.toString()))]

    if (uniqueIds.length !== ids.length) {
        throw error("Duplicate order IDs", 400)
    }

    const orders = await Order.find({
        _id: { $in: ids },
        status: ORDER_STATUS.PENDING
    })
        .populate("storeId", "address")
        .session(session)

    if (orders.length !== ids.length) {
        throw error("Some orders are unavailable or already assigned", 409)
    }

    const orderGroupIds = new Set(
        orders.map(order => order.orderGroupId.toString())
    )

    if (orderGroupIds.size !== 1) {
        throw error("All orders must belong to the same order group", 400)
    }

    const orderGroupId = orders[0].orderGroupId
    const pickupLocations = getDeliveryPickupLocations(orders)
    return { orderGroupId, pickupLocations }
}

const validateSubOrdersAvailability = async (orderGroupId, session) => {
    const hasInvalidOrders = await Order.exists({
        orderGroupId,
        status: { $ne: ORDER_STATUS.COLLECTED }
    }).session(session);

    if (hasInvalidOrders) {
        throw error("Some orders are not collected yet");
    }
}

const getDeliveryPickupLocations = (orders) => {
    const pickupMap = new Map()

    for (const order of orders) {
        const store = order.storeId

        if (!store?.address?.coordinates) {
            throw error("Store address not found", 400)
        }

        const storeId = store._id.toString()

        if (!pickupMap.has(storeId)) {
            pickupMap.set(storeId, {
                storeId: store._id,
                location: store.address.coordinates,
                orderIds: []
            })
        }

        pickupMap.get(storeId).orderIds.push(order._id)
    }

    return [...pickupMap.values()]
}

const validateDriver = async (driverId, session) => {
    const driver = await User.findOne({ _id: driverId, role: ROLE.DRIVER, status: STATUS.ACTIVE })
        .session(session)
    if (!driver) throw error("driver not found", 404)
}

// delivery Operations
const createDeliveryTask = async ({
    orderGroupId,
    orderIds,
    driverId,
    driverPayment,
    pickupLocation,
    deliveryLocation,
    type,
    createdBy
}, session) => {
    const [deliveryTask] = await Delivery.create(
        [{
            orderGroupId,
            orderIds,
            driverId,
            driverPayment,
            pickupLocation,
            deliveryLocation,
            type,
            createdBy
        }], { session })
    return deliveryTask
}

const updateDeliveryTask = async ({ query, updates }, session) => {
    const updatedTask = await Delivery.findOneAndUpdate(
        query,
        updates,
        { new: true, ...(session ? { session } : {}) }
    )
    if (!updatedTask) throw error("Delivery Task not found")
    return updatedTask
}

const getDeliveryTasks = async (actor) => {
    if (!actor?._id || !actor?.role) {
        throw error("Authentication required", 401);
    }

    const query = {};
    if (actor.role === ROLE.DRIVER) {
        query.driverId = actor._id;
    } else if (actor.role !== ROLE.ADMIN) {
        throw error("Forbidden", 403);
    }

    return Delivery.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .populate("orderGroupId")
        .populate({
            path: "orderIds",
            populate: { path: "storeId", select: "name" }
        })
        .populate("driverId", "name phoneNumber")
        .populate("createdBy", "name")
        .lean();
};

const getDeliveryTask = async ({ deliveryTaskId, actor }) => {
    if (!actor?._id || !actor?.role) {
        throw error("Authentication required", 401);
    }

    const query = { _id: deliveryTaskId };
    if (actor.role === ROLE.DRIVER) {
        query.driverId = actor._id;
    } else if (actor.role !== ROLE.ADMIN) {
        throw error("Forbidden", 403);
    }

    const deliveryTask = await Delivery.findOne(query)
        .populate("orderGroupId")
        .populate({
            path: "orderIds",
            populate: { path: "storeId", select: "name" }
        })
        .populate("driverId", "name phoneNumber")
        .populate("createdBy", "name")
        .lean();

    if (!deliveryTask) {
        throw error("Delivery Task not found", 404);
    }

    return deliveryTask;
};

const cancelDeliveryTask = async (deliveryTaskId) => {
    const session = await mongoose.startSession();
    try {
        let cancelledTask;
        await session.withTransaction(async () => {
            const deliveryTask = await Delivery.findOne({
                _id: deliveryTaskId,
                status: DELIVERY_STATUS.INPROGRESS
            }).session(session);

            if (!deliveryTask) {
                throw error("Delivery Task not found or is no longer active", 404);
            }

            if (deliveryTask.type === DELIVERY_TYPE.COLLECTION) {
                if (!deliveryTask.orderIds?.length) {
                    throw error("Delivery task has no orders");
                }

                const updatedOrders = await Order.updateMany(
                    {
                        _id: { $in: deliveryTask.orderIds },
                        status: ORDER_STATUS.COLLECTING
                    },
                    { $set: { status: ORDER_STATUS.PENDING } },
                    { session }
                );

                if (updatedOrders.matchedCount !== deliveryTask.orderIds.length) {
                    throw error("Some orders could not be returned to pending", 409);
                }
            } else if (deliveryTask.type === DELIVERY_TYPE.FINAL) {
                const updatedOrderGroup = await OrderGroup.findOneAndUpdate(
                    {
                        _id: deliveryTask.orderGroupId,
                        status: ORDER_STATUS.IN_DELIVERY
                    },
                    { $set: { status: ORDER_STATUS.PENDING } },
                    { session, new: true }
                );

                if (!updatedOrderGroup) {
                    throw error("Order group could not be returned to pending", 409);
                }
            } else {
                throw error("Unsupported delivery task type", 400);
            }

            cancelledTask = await Delivery.findOneAndUpdate(
                {
                    _id: deliveryTaskId,
                    status: DELIVERY_STATUS.INPROGRESS
                },
                {
                    $set: {
                        status: DELIVERY_STATUS.CANCELLED,
                        cancelledAt: new Date()
                    }
                },
                { session, new: true }
            );

            if (!cancelledTask) {
                throw error("Delivery Task is no longer active", 409);
            }
        });
        return cancelledTask;
    } finally {
        await session.endSession();
    }
};

const createCollectingDelivery = async ({ orderIds, driverId, amount, deliveryLocation, adminId }) => {
    const session = await mongoose.startSession()
    try {
        let createdDelivery;
        await session.withTransaction(async () => {
            const { orderGroupId, pickupLocations } = await validateOrdersAvalilability(orderIds, session)

            await validateDriver(driverId, session)

            const driverPayment = { amount }

            const deliveryTask = await createDeliveryTask({
                orderGroupId,
                orderIds,
                driverId,
                deliveryLocation,
                pickupLocations,
                driverPayment,
                type: DELIVERY_TYPE.COLLECTION,
                createdBy: adminId
            }, session)

            const updatedOrders = await Order.updateMany(
                {
                    _id: { $in: orderIds },
                    status: ORDER_STATUS.PENDING
                },
                {
                    $set: {
                        status: ORDER_STATUS.COLLECTING
                    }
                },
                {
                    session
                }
            )

            if (updatedOrders.matchedCount !== orderIds.length) {
                throw error("Some orders are already assigned", 409)
            }

            createdDelivery = deliveryTask
        })
        return createdDelivery
    } finally {
        await session.endSession()
    }
}

const createFinalDelivery = async ({ orderGroupId, driverId, amount, pickupLocation, adminId }) => {
    const session = await mongoose.startSession()
    let createdTask
    try {
        await session.withTransaction(async () => {
            const orderGroup = await OrderGroup.findOne({ _id: orderGroupId, status: ORDER_STATUS.PENDING }).session(session)
            if (!orderGroup)
                throw error("Order group not found")

            const hasExistingFinalTask = await Delivery.findOne({
                orderGroupId,
                type: DELIVERY_TYPE.FINAL,
                status: { $ne: DELIVERY_STATUS.CANCELLED }
            }).session(session)

            if (hasExistingFinalTask)
                throw error("this order has active delivery task")

            await validateSubOrdersAvailability(orderGroupId, session)

            await validateDriver(driverId, session)

            const driverPayment = { amount }

            const deliveryTask = await createDeliveryTask({
                orderGroupId,
                driverId,
                pickupLocation,
                deliveryLocation: orderGroup.deliveryAddress,
                driverPayment,
                type: DELIVERY_TYPE.FINAL,
                createdBy: adminId
            }, session)

            const updatedOrderGroup = await OrderGroup.findOneAndUpdate(
                { _id: orderGroupId, status: ORDER_STATUS.PENDING },
                { $set: { status: ORDER_STATUS.IN_DELIVERY } },
                { session }
            )
            if (!updatedOrderGroup)
                throw error("cant update the order group")

            createdTask = deliveryTask
        })
        return createdTask;
    } finally {
        await session.endSession()
    }
}

const assignDriverToTask = async ({ driverId, deliveryTaskId }) => {
    const session = await mongoose.startSession()
    try {
        await session.withTransaction(async () => {
            const driver = await User.findOne({ _id: driverId, role: ROLE.DRIVER, status: STATUS.ACTIVE }).session()
            if (!driver) throw error("Driver not found")

            const query = {
                _id: deliveryTaskId,
                status: DELIVERY_STATUS.INPROGRESS
            }
            const updates = {
                driverId,
                assignedAt: new Date()
            }
            await updateDeliveryTask({ query, updates }, session)
        })
    } finally {
        await session.endSession()
    }
}

const completeCollectingDelivery = async ({ deliveryTaskId, driverId }) => {
    const session = await mongoose.startSession()
    try {
        let completedTask;
        await session.withTransaction(async () => {
            const deliveryTask = await Delivery.findOne(
                {
                    _id: deliveryTaskId,
                    status: DELIVERY_STATUS.INPROGRESS,
                    type: DELIVERY_TYPE.COLLECTION,
                    driverId
                }).session(session)
            if (!deliveryTask) throw error("delivery task not found", 404)

            const orderIds = deliveryTask.orderIds
            if (!orderIds?.length)
                throw error("invalid orders in the task")

            // update orders 
            const updatedOrders = await Order.updateMany(
                {
                    _id: { $in: orderIds },
                    status: ORDER_STATUS.COLLECTING
                },
                {
                    $set: {
                        status: ORDER_STATUS.COLLECTED
                    }
                },
                { session }
            )
            if (updatedOrders.matchedCount !== orderIds.length)
                throw error("cant update some orders.")

            const query = {
                _id: deliveryTaskId,
                status: DELIVERY_STATUS.INPROGRESS,
                type: DELIVERY_TYPE.COLLECTION,
                driverId
            }
            const updates = {
                status: DELIVERY_STATUS.COMPLETED,
                completedAt: new Date()
            }
            const updatedTask = await updateDeliveryTask({ query, updates }, session)
            completedTask = updatedTask
        })
        return completedTask
    } finally {
        await session.endSession()
    }
}

const completeFinalDelivery = async ({ deliveryTaskId, driverId }) => {
    const session = await mongoose.startSession()
    try {
        let completedTask;
        await session.withTransaction(async () => {
            const deliveryTask = await Delivery.findOne(
                {
                    _id: deliveryTaskId,
                    status: DELIVERY_STATUS.INPROGRESS,
                    type: DELIVERY_TYPE.FINAL,
                    driverId
                }).session(session)
            if (!deliveryTask)
                throw error("delivery task not found", 404)

            // update order group 
            const updatedOrderGroup = await OrderGroup.findOneAndUpdate(
                {
                    _id: deliveryTask.orderGroupId,
                    status: ORDER_STATUS.IN_DELIVERY
                },
                {
                    $set: {
                        status: ORDER_STATUS.DELIVERED
                    }
                },
                { session }
            )
            if (!updatedOrderGroup)
                throw error("cant update this order group.")

            const query = {
                _id: deliveryTaskId,
                type: DELIVERY_TYPE.FINAL,
                status: DELIVERY_STATUS.INPROGRESS,
                driverId
            }
            const updates = {
                status: DELIVERY_STATUS.COMPLETED,
                completedAt: new Date()
            }
            const updatedTask = await updateDeliveryTask({ query, updates }, session)
            completedTask = updatedTask
        })
        return completedTask
    } finally {
        await session.endSession()
    }
}

module.exports = {
    calculateDeliveryFee,
    resolveUserPoint,
    createCollectingDelivery,
    assignDriverToTask,
    createFinalDelivery,
    completeCollectingDelivery,
    completeFinalDelivery,
    getDeliveryTasks,
    getDeliveryTask,
    cancelDeliveryTask
}