const Region = require('../models/Region');
const { GAZA_REGIONS } = require('../constants/gaza-regions');
const error = require('../utils/error');

async function ensureRegionsSeeded() {
    await Promise.all(GAZA_REGIONS.map((region) => Region.updateOne(
        { id: region.id },
        {
            $setOnInsert: {
                id: region.id,
                name: region.name,
                isActive: region.isActive,
                center: region.center,
                cities: region.cities,
            },
        },
        { upsert: true, runValidators: true }
    )));
}

async function assertStoresHaveActiveRegions(stores, session) {
    const regionIds = stores.map((store) => store.address?.region);
    if (regionIds.some((id) => typeof id !== 'string' || !id.trim())) {
        throw error('One or more stores do not have a valid region');
    }

    await ensureRegionsSeeded();

    const activeRegions = await Region.find({
        id: { $in: [...new Set(regionIds)] },
        isActive: true,
    })
        .select('id')
        .session(session)
        .lean();
    const activeRegionIds = new Set(activeRegions.map((region) => region.id));

    if (regionIds.some((id) => !activeRegionIds.has(id))) {
        throw error('One or more stores belong to an invalid or inactive region');
    }
}

module.exports = {
    ensureRegionsSeeded,
    assertStoresHaveActiveRegions,
};
