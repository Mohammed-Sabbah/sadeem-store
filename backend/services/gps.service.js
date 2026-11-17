const calculateDistance = (point1, point2) => {
    const R = 6371;

    const toRad = (value) => value * Math.PI / 180;

    const dLat = toRad(point2.lat - point1.lat);
    const dLng = toRad(point2.lng - point1.lng);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(point1.lat)) *
        Math.cos(toRad(point2.lat)) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

const getFarthestPoint = (addressPoint, points) => {
    return points.reduce((farthest, point) => {
        const distance = calculateDistance(addressPoint, point);

        if (!farthest || distance > farthest.distance) {
            return { ...point, distance };
        }

        return farthest;
    }, null);
};

const normalizePoint = (point, label) => {
    const lat = Number(point?.lat);
    const lng = Number(point?.lng);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
        !Number.isFinite(lng) || lng < -180 || lng > 180) {
        throw new TypeError(`${label} must contain valid latitude and longitude`);
    }

    return { lat, lng };
};

module.exports = {
    calculateDistance,
    getFarthestPoint,
    normalizePoint,
}