const mongoose = require('mongoose');
const { escapeRegex } = require("./index")

function createProductFilter(query, admin) {
    const filter = { isDeleted: { $ne: true } };

    if (admin) {
        if (query.isActive !== undefined) filter.isActive = query.isActive;
        if (query.isSuspended !== undefined) filter.isSuspended = query.isSuspended;
    } else {
        filter.isActive = { $ne: false };
        filter.isSuspended = { $ne: true };
    }

    if (query.storeId) {
        filter.storeId = new mongoose.Types.ObjectId(query.storeId);
    }
    if (query.search) {
        const search = new RegExp(escapeRegex(query.search), 'i');
        filter.$or = [{ title: search }, { description: search }];
    }

    return filter;
}


module.exports = {
    createProductFilter
}