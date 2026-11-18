const { RATE_PER_KM, STORE_FEE } = require("../constants/delivery");
const { roundMoney } = require("../utils/wallet");
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

const divideByRegion = (storeOrders) => {
    const regionMap = new Map();

    for (const order of storeOrders) {
        const region = order.region || order?.storeId?.address?.region;
        if (!region) {
            throw new TypeError("Store order must include a region");
        }
        const regionId = region.toString();

        if (!regionMap.has(regionId)) {
            regionMap.set(regionId, {
                region,
                orders: [],
                subtotal: 0
            });
        }

        const storeRegion = regionMap.get(regionId);

        storeRegion.orders.push(order);
        storeRegion.subtotal += order.subtotal;
    }

    return Array.from(regionMap.values());
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

module.exports = {
    calculateDeliveryFee,
    resolveUserPoint
}