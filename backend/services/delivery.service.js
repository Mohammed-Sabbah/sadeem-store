const { RATE_PER_KM, STORE_FEE } = require("../constants/delivery");
const error = require("../utils/error");
const { getFarthestPoint, normalizePoint } = require("./gps.service");

const resolveUserPoint = (address) => {
    const directPoint = address?.coordinates || null;

    if (!directPoint)
        throw error("User address must include coordinates or a recognized city", 400);

    if (directPoint?.lat !== undefined || directPoint?.lng !== undefined) {
        return normalizePoint(directPoint, "User address");
    }
    throw error("User address must include coordinates or a recognized city", 400);
};

const calculateDeliveryFee = (regionsOrders, address) => {
    if (!Array.isArray(regionsOrders)) {
        throw new TypeError("Region orders must be an array");
    }

    if (regionsOrders.length === 0) {
        return { regions: [], totalFee: 0 };
    }

    const addressPoint = resolveUserPoint(address);
    const regions = regionsOrders.map(regionOrder => {
        if (!Array.isArray(regionOrder.orders)) {
            throw new TypeError("Each region order must contain an orders array");
        }

        if (regionOrder.orders.length === 0) {
            return {
                regionId: regionOrder.regionId,
                storeCount: 0,
                farthestDistanceKm: 0,
                deliveryFee: 0
            };
        }

        const storePoints = regionOrder.orders.map(order => ({
            ...normalizePoint(order.storePoint, "Store address"),
            storeId: order.storeId
        }));
        const farthestStore = getFarthestPoint(addressPoint, storePoints);
        const distanceFee = farthestStore.distance * RATE_PER_KM;
        const storesFee = regionOrder.orders.length * STORE_FEE;
        const deliveryFee = Number((distanceFee + storesFee).toFixed(2));
        console.log({
            regionId: regionOrder.regionId,
            storeCount: regionOrder.orders.length,
            farthestDistanceKm: Number(farthestStore.distance.toFixed(2)),
            deliveryFee
        })
        return {
            regionId: regionOrder.regionId,
            storeCount: regionOrder.orders.length,
            farthestDistanceKm: Number(farthestStore.distance.toFixed(2)),
            deliveryFee
        };
    });

    const totalFee = Number(
        regions.reduce((total, region) => total + region.deliveryFee, 0).toFixed(2)
    );

    return { regions, totalFee };
};

module.exports = {
    calculateDeliveryFee
}