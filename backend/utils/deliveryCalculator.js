const { RATE_PER_KM, MIN_FEE, MAX_FEE, ADDITIONAL_STORE_FEE, CURRENCY } = require('../config/delivery.config');
const { GAZA_REGIONS } = require('../constants/gaza-regions');

/**
 * حساب المسافة بالكيلومتر بين إحداثيتين باستخدام Haversine Formula
 * دقة فائقة، تعمل محلياً دون أي خوادم خارجية أو تكاليف (0$)
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === lat2 && lon1 === lon2) return 0;

    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return Number(d.toFixed(2));
}

/**
 * استخراج الإحداثيات سواء من GPS مباشر أو من مركز المدينة
 */
function resolveCoordinates(locationData) {
    if (!locationData) {
        // افتراضي: مركز المحافظة الوسطى
        return GAZA_REGIONS.central.center;
    }

    // إذا كانت إحداثيات GPS موجودة ومباشرة
    if (locationData.lat && locationData.lng) {
        return { lat: Number(locationData.lat), lng: Number(locationData.lng) };
    }

    if (locationData.coordinates && locationData.coordinates.lat && locationData.coordinates.lng) {
        return {
            lat: Number(locationData.coordinates.lat),
            lng: Number(locationData.coordinates.lng),
        };
    }

    // البحث في مراكز المدن
    const govKey = locationData.governorate || 'central';
    const cityKey = locationData.city || 'deir_albalah';

    const governorate = GAZA_REGIONS[govKey] || GAZA_REGIONS.central;
    const foundCity = governorate.cities ? governorate.cities.find((c) => c.id === cityKey) : null;

    if (foundCity && foundCity.center) {
        return foundCity.center;
    }

    return governorate.center;
}

/**
 * خوارزمية حساب سعر ورسوم التوصيل لسلة سَدِيم:
 * 1. تجميع المتاجر حسب المحافظة كشحنات مستقلة.
 * 2. لكل شحنة: حساب مسافة أبعد متجر للزبون * 2 ₪ + 4 ₪ لكل متجر إضافي.
 * 3. تقييد سعر كل شحنة بين الحد الأدنى (7 ₪) والحد الأقصى (80 ₪).
 */
function calculateDeliveryFee(stores, customerAddress) {
    if (!Array.isArray(stores) || stores.length === 0) {
        return {
            shipments: [],
            totalFee: 0,
            currency: CURRENCY,
        };
    }

    const customerCoord = resolveCoordinates(customerAddress);

    // تجميع المتاجر حسب المحافظة
    const storesByGovernorate = {};
    stores.forEach((store) => {
        const gov = store.governorate || 'central';
        if (!storesByGovernorate[gov]) {
            storesByGovernorate[gov] = [];
        }
        storesByGovernorate[gov].push(store);
    });

    const shipments = [];
    let totalFee = 0;

    Object.keys(storesByGovernorate).forEach((govKey) => {
        const govStores = storesByGovernorate[govKey];
        const govMeta = GAZA_REGIONS[govKey] || { name: govKey };

        let maxDistance = 0;
        let farthestStore = null;

        govStores.forEach((store) => {
            const storeCoord = resolveCoordinates(store.location || store);
            const dist = calculateHaversineDistance(
                storeCoord.lat,
                storeCoord.lng,
                customerCoord.lat,
                customerCoord.lng
            );

            if (dist >= maxDistance) {
                maxDistance = dist;
                farthestStore = store;
            }
        });

        // الحسبة للشحنة الواحدة
        const additionalStoresCount = govStores.length - 1;
        const baseDistanceCost = maxDistance * RATE_PER_KM;
        const additionalStopsCost = additionalStoresCount * ADDITIONAL_STORE_FEE;
        const rawFee = Math.round(baseDistanceCost + additionalStopsCost);

        // تقييد السعر بين الحد الأدنى والأقصى
        const finalShipmentFee = Math.max(MIN_FEE, Math.min(MAX_FEE, rawFee));

        totalFee += finalShipmentFee;

        shipments.push({
            governorateId: govKey,
            governorateName: govMeta.name,
            storesCount: govStores.length,
            stores: govStores.map((s) => ({
                id: s._id || s.id,
                name: s.name,
            })),
            maxDistanceKm: maxDistance,
            farthestStoreName: farthestStore ? farthestStore.name : '',
            shipmentFee: finalShipmentFee,
        });
    });

    return {
        shipments,
        totalFee,
        currency: CURRENCY,
    };
}

module.exports = {
    calculateHaversineDistance,
    resolveCoordinates,
    calculateDeliveryFee,
};
