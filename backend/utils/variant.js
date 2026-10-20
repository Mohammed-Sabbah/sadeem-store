const Variant = require('../models/Variant');
const { STATUS } = require('../constants/enums');

const getDefaultVariant = (price, stock, image) => {
    return {
        attributes: {},
        price,
        stock,
        image
    }
}

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

const prepareProductVariants = (variants, category, requireAttribute) => {
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

        const variant = {
            attributes: normalized.attributes,
            price: submittedVariant.price,
            stock: submittedVariant.stock,
            isDeleted: false,
            ...(submittedVariant.image !== undefined ? { image: submittedVariant.image } : {}),
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
