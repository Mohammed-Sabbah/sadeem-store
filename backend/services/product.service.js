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
    const { title, description, categoryId, images, existingImages, imageOrder, uploadedImages } = updates;

    const previousImages = Array.isArray(product.images) ? [...product.images] : [];
    
    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (categoryId !== undefined) product.categoryId = categoryId;
    
    const newUploads = Array.isArray(uploadedImages) ? uploadedImages : [];
    const hasImageUpdates = existingImages !== undefined || imageOrder !== undefined || newUploads.length > 0 || (Array.isArray(images) && images.length > 0);

    let finalImages = null;
    if (hasImageUpdates) {
        let parsedExisting = [];
        if (typeof existingImages === "string") {
            try { parsedExisting = JSON.parse(existingImages); } catch { parsedExisting = []; }
        } else if (Array.isArray(existingImages)) {
            parsedExisting = existingImages;
        } else if (Array.isArray(images) && newUploads.length === 0) {
            parsedExisting = images;
        } else {
            parsedExisting = previousImages;
        }

        let parsedOrder = [];
        if (typeof imageOrder === "string") {
            try { parsedOrder = JSON.parse(imageOrder); } catch { parsedOrder = []; }
        } else if (Array.isArray(imageOrder)) {
            parsedOrder = imageOrder;
        }

        const owned = new Set(previousImages);
        const kept = parsedExisting.filter(url => typeof url === "string" && owned.has(url.trim()));

        if (parsedOrder.length > 0) {
            finalImages = parsedOrder.map((token) => {
                if (typeof token !== "string") return null;
                const match = token.match(/^new:(\d+)$/);
                if (match) {
                    const idx = parseInt(match[1], 10);
                    return Number.isInteger(idx) && idx >= 0 && idx < newUploads.length ? newUploads[idx] : null;
                }
                return kept.includes(token) ? token : null;
            }).filter(Boolean);

            for (const u of newUploads) {
                if (!finalImages.includes(u)) finalImages.push(u);
            }
        } else {
            finalImages = [...kept, ...newUploads];
        }

        // Remove duplicate URLs while maintaining order
        finalImages = Array.from(new Set(finalImages));
        product.images = finalImages.slice(0, 5);
    }
    
    await product.save();

    if (finalImages !== null) {
        const finalSet = new Set(product.images);
        const toDelete = previousImages.filter((url) => !finalSet.has(url));
        if (toDelete.length > 0) {
            try {
                await deleteImages(toDelete);
            } catch (error) {
                console.error("Failed to delete removed images:", error);
            }
        }
    }

    return product;
};

module.exports = { deleteProductWithVariants, updateProduct };