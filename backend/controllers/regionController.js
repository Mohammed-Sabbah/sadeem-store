const Region = require('../models/Region');
const { GAZA_REGIONS } = require('../constants/gaza-regions');
const { success, error } = require('../utils/responses');
const { ensureRegionsSeeded } = require('../services/region.service');

const regionIds = GAZA_REGIONS.map((region) => region.id);
const regionOrder = new Map(regionIds.map((id, index) => [id, index]));

function getRegionResponse(region) {
    return {
        ...region,
        id: region.id,
        isActive: region.isActive,
        cities: region.cities,
    };
}

async function getRegionsResponse(filter) {
    await ensureRegionsSeeded();

    const regions = await Region.find({
        id: { $exists: true, $nin: [null, ''] },
        ...filter,
    }).lean();
    regions.sort((a, b) => {
        const aOrder = regionOrder.has(a.id) ? regionOrder.get(a.id) : regionIds.length;
        const bOrder = regionOrder.has(b.id) ? regionOrder.get(b.id) : regionIds.length;
        return aOrder - bOrder || a.id.localeCompare(b.id);
    });
    const list = regions.map(getRegionResponse);
    const regionsMap = {};
    list.forEach((region) => {
        regionsMap[region.id] = region;
    });

    return {
        count: list.length,
        regions: regionsMap,
        list,
    };
}

async function getAllRegions(req, res, next) {
    try {
        return success(res, 200, await getRegionsResponse({ isActive: true }));
    } catch (err) {
        return next(err);
    }
}

async function getAllRegionsForAdmin(req, res, next) {
    try {
        return success(res, 200, await getRegionsResponse({}));
    } catch (err) {
        return next(err);
    }
}

async function getRegionById(req, res, next) {
    try {
        await ensureRegionsSeeded();
        const region = await Region.findOne({ id: req.params.id, isActive: true }).lean();

        if (!region) return error(res, 404, 'Region not found');

        return success(res, 200, {
            region: getRegionResponse(region),
        });
    } catch (err) {
        return next(err);
    }
}

async function getRegionByIdForAdmin(req, res, next) {
    try {
        await ensureRegionsSeeded();
        const region = await Region.findOne({ id: req.params.id }).lean();

        if (!region) return error(res, 404, 'Region not found');

        return success(res, 200, {
            region: getRegionResponse(region),
        });
    } catch (err) {
        return next(err);
    }
}

async function createRegion(req, res, next) {
    try {
        await ensureRegionsSeeded();
        const region = await Region.create({
            id: req.body.id,
            name: req.body.name,
            center: req.body.center,
            isActive: req.body.isActive,
        });

        return success(res, 201, {
            message: 'Region created successfully',
            region: getRegionResponse(region.toObject()),
        });
    } catch (err) {
        return next(err);
    }
}

async function addCity(req, res, next) {
    try {
        await ensureRegionsSeeded();
        const city = {
            id: req.body.id,
            name: req.body.name,
            center: req.body.center,
        };
        const region = await Region.findOneAndUpdate(
            { id: req.params.id, 'cities.id': { $ne: city.id } },
            { $push: { cities: city } },
            { new: true, runValidators: true }
        ).lean();

        if (!region) {
            const existingRegion = await Region.exists({ id: req.params.id });
            if (!existingRegion) return error(res, 404, 'Region not found');
            return error(res, 409, 'City id already exists in this region');
        }

        return success(res, 201, {
            message: 'City added successfully',
            region: getRegionResponse(region),
        });
    } catch (err) {
        return next(err);
    }
}

async function updateRegionStatus(req, res, next) {
    try {
        await ensureRegionsSeeded();
        const region = await Region.findOneAndUpdate(
            { id: req.params.id },
            { $set: { isActive: req.body.isActive } },
            { new: true, runValidators: true }
        ).lean();

        if (!region) return error(res, 404, 'Region not found');

        return success(res, 200, {
            message: 'Region status updated successfully',
            region: getRegionResponse(region),
        });
    } catch (err) {
        return next(err);
    }
}

async function updateRegionCenter(req, res, next) {
    try {
        await ensureRegionsSeeded();
        const region = await Region.findOneAndUpdate(
            { id: req.params.id },
            { $set: { center: req.body.center } },
            { new: true, runValidators: true }
        ).lean();

        if (!region) return error(res, 404, 'Region not found');

        return success(res, 200, {
            message: 'Region center updated successfully',
            region: getRegionResponse(region),
        });
    } catch (err) {
        return next(err);
    }
}

async function updateCityCenter(req, res, next) {
    try {
        await ensureRegionsSeeded();
        const region = await Region.findOneAndUpdate(
            { id: req.params.id, 'cities.id': req.params.cityId },
            { $set: { 'cities.$.center': req.body.center } },
            { new: true, runValidators: true }
        ).lean();

        if (!region) return error(res, 404, 'Region or city not found');

        return success(res, 200, {
            message: 'City center updated successfully',
            region: getRegionResponse(region),
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    ensureRegionsSeeded,
    getAllRegions,
    getAllRegionsForAdmin,
    getRegionById,
    getRegionByIdForAdmin,
    createRegion,
    addCity,
    updateRegionStatus,
    updateRegionCenter,
    updateCityCenter,
};
