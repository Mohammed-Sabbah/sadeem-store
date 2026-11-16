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

const getAddress = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error("Geolocation is not supported"));
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                resolve({
                    lat: latitude,
                    lng: longitude
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

const getRegionAndCity = (userPoint, regions) => {
    let nearestCity = null;

    for (const region of regions) {
        for (const city of region.cities) {
            const distance = calculateDistance(
                userPoint,
                city.center
            );

            if (!nearestCity || distance < nearestCity.distance) {
                nearestCity = {
                    region,
                    city,
                    distance
                };
            }
        }
    }

    return nearestCity;
};

const getFullAddress = async () => {
    const userPoint = await getAddress();
    const regions = []
    const userAddress = getRegionAndCity(userPoint, regions);
    return userAddress;
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
    getFullAddress,
    normalizePoint,
}