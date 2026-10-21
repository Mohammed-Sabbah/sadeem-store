function normalizeAttributeKey(key) {
    return String(key || '').trim().toLowerCase();
}

function getAttributeDefinitionKey(definition) {
    return definition.key || definition.name;
}

function getNormalizedAttributeDefinitionKey(definition) {
    return normalizeAttributeKey(getAttributeDefinitionKey(definition));
}

function getAttributeEntries(attributes) {
    return attributes instanceof Map
        ? Array.from(attributes.entries())
        : Object.entries(attributes || {});
}

module.exports = {
    normalizeAttributeKey,
    getAttributeDefinitionKey,
    getNormalizedAttributeDefinitionKey,
    getAttributeEntries,
};
