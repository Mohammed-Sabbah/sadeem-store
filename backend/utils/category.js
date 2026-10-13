const mongoose = require('mongoose');
const Store = require('../models/Store');

function slugify(text) {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0621-\u064A-]+/g, '')
        .replace(/--+/g, '-');
}

function hasBreakingVariantAttributeChanges(currentDefinitions = [], updatedDefinitions = []) {
    const updatedByName = new Map(
        updatedDefinitions.map((definition) => [definition.name.trim().toLowerCase(), definition])
    );

    return currentDefinitions.some((currentDefinition) => {
        const updatedDefinition = updatedByName.get(currentDefinition.name.trim().toLowerCase());
        if (!updatedDefinition) return true;

        const updatedValues = new Set(
            (updatedDefinition.values || []).map((value) => value.trim().toLowerCase())
        );
        return (currentDefinition.values || []).some((value) => !updatedValues.has(value.trim().toLowerCase()));
    });
}

function mergeVariantAttributes(currentDefinitions = [], submittedDefinitions = []) {
    const mergedDefinitions = [...currentDefinitions];
    const definitionIndexes = new Map(
        mergedDefinitions.map((definition, index) => [
            definition.name.trim().toLowerCase(),
            index,
        ])
    );

    for (const definition of submittedDefinitions) {
        const key = definition.name.trim().toLowerCase();
        const existingIndex = definitionIndexes.get(key);
        if (existingIndex === undefined) {
            definitionIndexes.set(key, mergedDefinitions.length);
            mergedDefinitions.push(definition);
        } else {
            mergedDefinitions[existingIndex] = definition;
        }
    }

    return mergedDefinitions;
}

function removeVariantAttribute(definitions = [], attributeName = '') {
    const normalizedName = attributeName.trim().toLowerCase();
    return definitions.filter((definition) =>
        definition.name.trim().toLowerCase() !== normalizedName
    );
}

async function getCategoryStoreIds(categoryId, storeId) {
    const storeFilter = { categoryId: new mongoose.Types.ObjectId(categoryId) };
    if (storeId) storeFilter._id = new mongoose.Types.ObjectId(storeId);
    return Store.distinct('_id', storeFilter);
}

module.exports = {
    slugify,
    hasBreakingVariantAttributeChanges,
    mergeVariantAttributes,
    removeVariantAttribute,
    getCategoryStoreIds,
};