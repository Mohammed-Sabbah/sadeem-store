const Product = require("../models/Product")
const Variant = require("../models/Variant")
const { withMongoTransaction } = require("../config/db")
const { deleteProductImages } = require("./cloudinary.service")


const deleteProductWithVariants = async (productId) => {
    const deletedData = await withMongoTransaction(async (session) => {
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

    await deleteProductImages(deletedData.product, deletedData.variants);
    return deletedData.product;
}

module.exports = { deleteProductWithVariants };