const Product = require("../models/Product")
const Variant = require("../models/Variant")
const { withMongoTransaction } = require("../config/db")
const { deleteProductWithVariantsImages, deleteImages } = require("./cloudinary.service")
const { validateNewProductImages } = require("../utils/images")

const createProduct = async (productData, options) => {
    const product = new Product(productData)
    await product.save(options)
    return product
}

const createProductWithVariants = async (productData, variantsData) => {
    return withMongoTransaction(async (session) => {
        const options = session ? { session } : {};
        const product = await createProduct(productData, options)
        const variants = variantsData.map((variant) => ({
            ...variant,
            attributes: new Map(Object.entries(variant.attributes || {})),
            productId: product._id,
        }))

        await Variant.insertMany(variants, options)
        return product
    })
}

const updateProduct = async (product, updates) => {
    const { title, description, categoryId } = updates

    const result = validateNewProductImages(product, updates)

    if (!result) {
        const err = new Error("Some images do not belong to this product");
        err.statusCode = 400;
        throw err;
    }

    const { totalImages, deletedImages } = result

    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (categoryId !== undefined) product.categoryId = categoryId;

    if (Array.isArray(totalImages) && totalImages.length > 0) {
        product.images = totalImages || [];
    }

    await product.save();

    try {
        await deleteImages(deletedImages || []);
    } catch (error) {
        console.error("Failed to delete previous images:", error);
    }

    return product

};

const deleteProductWithVariants = async (productId, storeId) => {
    const deletedData = await withMongoTransaction(
        async (session) => {
            const options = session ? { session } : {};
            const product = await Product.findOne({
                _id: productId,
                storeId,
                isDeleted: { $ne: true },
            }).setOptions(options);

            if (!product) {
                return null;
            }

            const variants = await Variant.find({
                productId,
                isDeleted: { $ne: true },
            }).select("image").setOptions(options).lean();

            await Product.updateOne(
                { _id: productId, storeId, isDeleted: { $ne: true } },
                { $set: { isDeleted: true, images: [] } },
                options
            );

            await Variant.updateMany(
                { productId, storeId },
                { $set: { isDeleted: true, image: "" } },
                options
            );

            return { product, variants };
        });

    if (!deletedData) {
        return null;
    }

    await deleteProductWithVariantsImages(deletedData.product, deletedData.variants);
    return deletedData.product;
}

module.exports = {
    createProductWithVariants,
    deleteProductWithVariants,
    updateProduct,
};