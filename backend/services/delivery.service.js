const { RATE_PER_KM, STORE_FEE } = require("../constants/delivery");
const Region = require("../models/Region");
const error = require("../utils/error");
const { getFarthestPoint, normalizePoint } = require("./gps.service");

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

const calculateDeliveryFee = async (regionsOrders, address) => {
    if (!Array.isArray(regionsOrders)) {
        throw new TypeError("Region orders must be an array");
    }

    if (regionsOrders.length === 0) {
        return { regions: [], totalFee: 0 };
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
            ...normalizePoint(order.storePoint, "Store address"),
            storeId: order.storeId
        }));
        const farthestStore = getFarthestPoint(addressPoint, storePoints);
        const distanceFee = farthestStore.distance * RATE_PER_KM;
        const additionalStoresCount = Math.max(0, regionOrder.orders.length - 1);
        const storesFee = additionalStoresCount * STORE_FEE;
        const deliveryFee = Number((distanceFee + storesFee).toFixed(2));

        return {
            region: regionOrder.region,
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
    calculateDeliveryFee,
    resolveUserPoint
}