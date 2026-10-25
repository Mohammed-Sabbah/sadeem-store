const { ATTRIBUTE_VALUE_TYPE } = require('../constants/enums');
const {
    normalizeAttributeKey,
    getNormalizedAttributeDefinitionKey,
} = require('./attributes');

function slugify(text) {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0621-\u064A-]+/g, '')
        .replace(/--+/g, '-');
}

function hasBreakingVariantAttributeChanges(currentDefinitions, updatedDefinitions) {
    const updatedByKey = new Map(
        updatedDefinitions.map((definition) => [
            getNormalizedAttributeDefinitionKey(definition),
            definition,
        ])
    );

    return currentDefinitions.some((currentDefinition) => {
        const updatedDefinition = updatedByKey.get(getNormalizedAttributeDefinitionKey(currentDefinition));
        if (!updatedDefinition) return true;

        const currentType = currentDefinition.type || ATTRIBUTE_VALUE_TYPE.STRING;
        const updatedType = updatedDefinition.type || ATTRIBUTE_VALUE_TYPE.STRING;
        return currentType !== updatedType;
    });
}

function mergeVariantAttributes(currentDefinitions, submittedDefinitions) {
    const mergedDefinitions = [...currentDefinitions];
    const definitionIndexes = new Map(
        mergedDefinitions.map((definition, index) => [
            getNormalizedAttributeDefinitionKey(definition),
            index,
        ])
    );

    for (const definition of submittedDefinitions) {
        const normalizedKey = getNormalizedAttributeDefinitionKey(definition);
        const existingIndex = definitionIndexes.get(normalizedKey);
        if (existingIndex === undefined) {
            definitionIndexes.set(normalizedKey, mergedDefinitions.length);
            mergedDefinitions.push(definition);
        } else {
            mergedDefinitions[existingIndex] = definition;
        }
    }

    return mergedDefinitions;
}

function removeVariantAttribute(definitions, attributeKey) {
    const normalizedKey = normalizeAttributeKey(attributeKey);
    return definitions.filter((definition) =>
        getNormalizedAttributeDefinitionKey(definition) !== normalizedKey
    );
}

module.exports = {
    hasBreakingVariantAttributeChanges,
    mergeVariantAttributes,
    removeVariantAttribute,
    slugify,
};
