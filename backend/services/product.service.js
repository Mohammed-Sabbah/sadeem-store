const Product = require("../models/Product")
const Variant = require("../models/Variant")
const { withMongoTransaction } = require("../config/db")
const { deleteProductWithVariantsImages, deleteImages } = require("./cloudinary.service")
const { validateNewProductImages } = require("../utils/images")

const deleteProductWithVariants = async (productId) => {
    const deletedData = await withMongoTransaction(
        async (session) => {
            const options = session ? { session } : {};
            const product = await Product.findOne({
                _id: productId,
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
                { _id: productId, isDeleted: { $ne: true } },
                { $set: { isDeleted: true, images: [] } },
                options
            );

            await Variant.updateMany(
                { productId },
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

const updateProduct = async (product, updates) => {
    const { title, description, categoryId } = updates

    const result = validateNewProductImages(product, updates)

    if (!result) {
        return error(res, 400, "Some images do not belong to this product");
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

module.exports = { deleteProductWithVariants, updateProduct };