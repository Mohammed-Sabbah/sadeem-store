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

module.exports = { divideByRegion };
