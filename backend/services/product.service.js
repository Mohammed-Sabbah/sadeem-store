const Product = require("../models/Product")
const Variant = require("../models/Variant")
const { withMongoTransaction } = require("../config/db")
const { deleteProductWithVariantsImages, deleteImages } = require("./cloudinary.service")

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
    const { title, description, categoryId, images, existingImages } = updates;

    const previousImages = Array.isArray(product.images) ? [...product.images] : [];

    const totalImages = Array.isArray(existingImages) ? [...existingImages, ...images] : images

    const deletedImages = previousImages.filter(
        prevImage => !existingImages.includes(prevImage)
    );

    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (categoryId !== undefined) product.categoryId = categoryId;

    if (Array.isArray(images) && images.length > 0) {
        product.images = totalImages;
    }

    await product.save();

    try {
        await deleteImages(deletedImages);
    } catch (error) {
        console.error("Failed to delete previous images:", error);
    }

    return product

};

module.exports = { deleteProductWithVariants, updateProduct };