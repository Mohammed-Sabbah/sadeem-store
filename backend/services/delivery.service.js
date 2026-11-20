const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Region = require("../models/Region");
const Delivery = require("../models/delivery.model");
const Store = require("../models/Store");
const { RATE_PER_KM, STORE_FEE } = require("../constants/delivery");
const { roundMoney } = require("../utils/wallet");
const { getFarthestPoint, normalizePoint } = require("./gps.service");
const { divideByRegion } = require("./order.service");
const { ORDER_STATUS, ROLE, STATUS, DELIVERY_STATUS, APPROVE_STATUS, DELIVERY_TYPE } = require("../constants/enums");
const error = require("../utils/error")

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

const updateDeliveryTask = async ({ deliveryTaskId, updates }, session) => {
    const updatedTask = await Delivery.findOneAndUpdate(
        {
            _id: deliveryTaskId,
            status: DELIVERY_STATUS.INPROGRESS
        },
        updates,
        session ? { session } : {}
    )
    if (!updatedTask) throw error("Delivery Task not found")
    return updatedTask
}

const createCollectingDelivery = async ({ orderIds, driverId, amount, deliveryLocation, adminId }) => {
    const session = await mongoose.startSession()
    try {
        let createdDelivery;
        await session.withTransaction(async () => {
            const { orderGroupId, pickupLocations } = await validateOrdersAvalilability(orderIds, session)

            const driver = await User.findOne({ _id: driverId, role: ROLE.DRIVER, status: STATUS.ACTIVE })
                .session(session)
            if (!driver) throw error("driver not found", 404)

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
                        status: ORDER_STATUS.IN_DELIVERY
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

const createFinalDelivery = async ({ orderGroupId, driverId, amount }) => {

}

const assignDriverToTask = async ({ driverId, deliveryTaskId }) => {
    const session = await mongoose.session()
    try {
        await session.withTransaction(async () => {
            const driver = await User.findOne({ _id: driverId, role: ROLE.DRIVER, status: STATUS.ACTIVE }).session()
            if (!driver) throw error("Driver not found")

            const updates = {
                driverId,
                assignedAt: new Date()
            }
            await updateDeliveryTask({ deliveryTaskId, updates }, session)
        })
    } finally {
        await session.endSession()
    }
}

module.exports = {
    calculateDeliveryFee,
    resolveUserPoint
}