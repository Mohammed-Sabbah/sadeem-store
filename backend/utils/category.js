async function getCategoryStoreIds(categoryId, storeId) {
    const storeFilter = { categoryId: new mongoose.Types.ObjectId(categoryId) };
    if (storeId) storeFilter._id = new mongoose.Types.ObjectId(storeId);
    return Store.distinct('_id', storeFilter);
}

module.exports = {
    getCategoryStoreIds
}