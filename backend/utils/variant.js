const Variant = require('../models/Variant');
const { STATUS, ATTRIBUTE_VALUE_TYPE } = require('../constants/enums');
const {
    normalizeAttributeKey,
    getAttributeDefinitionKey,
    getNormalizedAttributeDefinitionKey,
    getAttributeEntries,
} = require('./attributes');

const getDefaultVariant = (price, stock, image) => {
    return {
        attributes: {},
        price,
        stock,
        image
    }
}

function normalizeAttributes(attributes, definitions) {
    const entries = getAttributeEntries(attributes);

    if (!entries.length) {
        return { attributes: {}, error: null };
    }

    const definitionByKey = new Map(
        definitions.map((definition) => [
            getNormalizedAttributeDefinitionKey(definition),
            definition,
        ])
    );
    const normalized = Object.create(null);

    for (const [key, value] of entries) {
        const definition = definitionByKey.get(normalizeAttributeKey(key));
        if (!definition) {
            return { attributes: null, error: `Variant attribute key "${key}" is not available for this category` };
        }

        const type = definition.type || ATTRIBUTE_VALUE_TYPE.STRING;
        const isValidValue =
            (type === ATTRIBUTE_VALUE_TYPE.STRING &&
                typeof value === 'string' &&
                value.trim().length > 0 &&
                value.trim().length <= 80) ||
            (type === ATTRIBUTE_VALUE_TYPE.NUMBER &&
                typeof value === 'number' &&
                Number.isFinite(value)) ||
            (type === ATTRIBUTE_VALUE_TYPE.BOOLEAN &&
                typeof value === 'boolean');
        if (!isValidValue) {
            return {
                attributes: null,
                error: `Value for "${definition.name}" must be a valid ${type}`,
            };
        }
        normalized[getAttributeDefinitionKey(definition)] =
            type === ATTRIBUTE_VALUE_TYPE.STRING ? value.trim() : value;
    }

    return { attributes: normalized, error: null };
}

function getVariantKey(attributes) {
    return getAttributeEntries(attributes)
        .map(([name, value]) => [normalizeAttributeKey(name), value])
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, value]) => JSON.stringify([name, value]))
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
    return getAttributeEntries(attributes).length > 0;
}

async function hasActiveVariants(productId) {
    return await Variant.exists({
        productId,
        status: STATUS.ACTIVE,
        isDeleted: false,
    });
}

const prepareProductVariants = (variants, category, requireAttribute, defaultImage) => {
    const variantsToCreate = []

    for (const submittedVariant of variants) {
        const normalized = normalizeAttributes(
            submittedVariant.attributes,
            category.variantAttributes
        );

        if (normalized.error) {
            return { variantsToCreate: [], err: { code: 400, msg: normalized.error } };
        }

        const shouldRequire = typeof requireAttribute === 'object' && requireAttribute !== null
            ? Boolean(requireAttribute.requireAttributes)
            : Boolean(requireAttribute);

        if (
            shouldRequire &&
            category.variantAttributes.length > 0 &&
            Object.keys(normalized.attributes).length === 0
        ) {
            return { variantsToCreate: [], err: { code: 400, msg: 'Variant attributes are required for this category' } };
        }

        const variantImage = submittedVariant.image || defaultImage;
        if (!variantImage) {
            return { variantsToCreate: [], err: { code: 400, msg: 'Product must have at least one image' } };
        }

        const variant = {
            attributes: normalized.attributes,
            price: submittedVariant.price,
            stock: submittedVariant.stock,
            image: variantImage,
            isDeleted: false,
        };

        if (variantsToCreate.length > 0) {
            const firstKeys = Object.keys(variantsToCreate[0].attributes).sort().join(',');
            const currentKeys = Object.keys(variant.attributes).sort().join(',');
            if (firstKeys !== currentKeys) {
                return { variantsToCreate: [], err: { code: 400, msg: 'All variants must have the same set of attributes' } };
            }
        }

        if (findDuplicateVariant(variantsToCreate, variant.attributes)) {
            return { variantsToCreate: [], err: { code: 409, msg: 'A variant with these attributes already exists' } };
        }

        variantsToCreate.push(variant);
    }
    return { variantsToCreate, err: null }
}

module.exports = {
    getDefaultVariant,
    normalizeAttributes,
    getVariantKey,
    findDuplicateVariant,
    hasVariantAttributes,
    hasActiveVariants,
    prepareProductVariants
};
