const Variant = require('../models/Variant');

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
                    attributes: result.attributes instanceof Map
                        ? Object.fromEntries(result.attributes)
                        : result.attributes || {},
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

module.exports = {
    toProductResponse,
    getProductResponse,
    getProductsWithVariants,
};
