const Variant = require('../models/Variant');
const { STATUS } = require('../constants/enums');
const { getAttributeEntries } = require('./attributes');

function toProductResponse(product, variants = product.variants || []) {
    const result = product.toObject
        ? product.toObject({ flattenMaps: true })
        : product;
    return {
        ...result,
        variants: variants
            .map((variant) => variant.toObject
                ? variant.toObject({ flattenMaps: true })
                : variant)
            .filter((variant) => variant.isDeleted == false)
            .map((variant) => {
                const result = { ...variant };
                delete result.productId;
                return {
                    ...result,
                    attributes: Object.fromEntries(getAttributeEntries(result.attributes)),
                };
            }),
    };
}

async function getProductResponse(product) {
    const variants = await Variant.find({ productId: product._id });
    return toProductResponse(product, variants);
}

async function getProductsWithVariants(products) {
    if (products.length === 0) return [];

    const productsIdsThatHaveVariants =
        products.map((product) => product._id);

    const variants = await Variant.find({
        productId: { $in: productsIdsThatHaveVariants },
    }).sort({ createdAt: 1, _id: 1 });

    const variantsByProduct = new Map();
    for (const variant of variants) {
        const productId = String(variant.productId);
        const productVariants = variantsByProduct.get(productId) || [];
        productVariants.push(variant);
        variantsByProduct.set(productId, productVariants);
    }
    return products.map((product) =>
        toProductResponse(product, variantsByProduct.get(String(product._id)) || [])
    );
}

async function deactivateProductWithNoActiveVariants(product) {
    const hasActiveVariant = await Variant.exists({
        productId: product._id,
        status: STATUS.ACTIVE,
        isDeleted: false,
    });
    if (!hasActiveVariant && product.status !== STATUS.IN_ACTIVE) {
        product.status = STATUS.IN_ACTIVE;
        await product.save();
    }
}



module.exports = {
    toProductResponse,
    getProductResponse,
    getProductsWithVariants,
    deactivateProductWithNoActiveVariants
};
