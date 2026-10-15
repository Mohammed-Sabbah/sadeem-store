const Variant = require('../models/Variant');
const { STATUS } = require('../constants/enums');

function normalizeAttributes(attributes, definitions) {
    const entries = attributes instanceof Map
        ? Array.from(attributes.entries())
        : Object.entries(attributes || {});
    const hasValues = entries.some(([, value]) => String(value || '').trim());

    if (!hasValues) {
        return { attributes: {}, error: null };
    }

    const definitionByName = new Map(
        definitions.map((definition) => [definition.name.trim().toLowerCase(), definition])
    );
    const normalized = Object.create(null);

    for (const [name, value] of entries) {
        const definition = definitionByName.get(name.trim().toLowerCase());
        if (!definition) {
            return { attributes: null, error: `Variant attribute "${name}" is not available for this category` };
        }

        const allowedValue = definition.values.find(
            (candidate) => candidate.trim().toLowerCase() === String(value).trim().toLowerCase()
        );
        if (!allowedValue) {
            return {
                attributes: null,
                error: `"${value}" is not an allowed value for "${definition.name}"`,
            };
        }
        normalized[definition.name] = allowedValue;
    }

    if (Object.keys(normalized).length !== definitions.length) {
        const missing = definitions
            .filter((definition) => !Object.prototype.hasOwnProperty.call(normalized, definition.name))
            .map((definition) => definition.name);
        return { attributes: null, error: `Variant is missing required attributes: ${missing.join(', ')}` };
    }

    return { attributes: normalized, error: null };
}

function getVariantKey(attributes) {
    const entries = attributes instanceof Map
        ? Array.from(attributes.entries())
        : Object.entries(attributes || {});
    return entries
        .map(([name, value]) => [name.toLowerCase(), String(value).toLowerCase()])
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, value]) => `${name}:${value}`)
        .join('|');
}

function findDuplicateVariant(variants, attributes, excludeId) {
    const key = getVariantKey(attributes);
    return variants.find((variant) =>
        variant.isDeleted == false &&
        String(variant._id) !== String(excludeId || '') &&
        getVariantKey(variant.attributes) === key
    );
}

function hasVariantAttributes(attributes) {
    return attributes instanceof Map
        ? attributes.size > 0
        : Object.keys(attributes || {}).length > 0;
}

async function hasActiveVariants(productId) {
    return await Variant.exists({
        productId,
        status: STATUS.ACTIVE,
        isDeleted: false,
    });
}

module.exports = {
    normalizeAttributes,
    getVariantKey,
    findDuplicateVariant,
    hasVariantAttributes,
    hasActiveVariants,
};
