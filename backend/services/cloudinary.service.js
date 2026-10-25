const Product = require("../models/Product")
const Variant = require("../models/Variant")
const cloudinary = require('../config/cloudinary');

const getPublicId = (imageUrl) => {
    try {
        const url = new URL(imageUrl);
        const cloudName = cloudinary.config().cloud_name;
        if (url.hostname !== 'res.cloudinary.com' || !cloudName) {
            return null;
        }

        const pathPrefix = `/${cloudName}/image/upload/`;
        if (!url.pathname.startsWith(pathPrefix)) {
            return null;
        }

        const path = decodeURIComponent(url.pathname.slice(pathPrefix.length));
        const pathSegments = path.split('/');
        const versionIndex = pathSegments.findIndex((segment) => /^v\d+$/.test(segment));
        const publicIdWithVersion = versionIndex === -1
            ? path
            : pathSegments.slice(versionIndex + 1).join('/');
        const publicId = publicIdWithVersion.replace(/\.[^/.]+$/, '');
        return publicId || null;
    } catch (err) {
        if (err instanceof TypeError || err instanceof URIError) {
            return null;
        }
        throw err;
    }
}

const deleteImage = async (publicId) => {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Cloudinary failed to delete image ${publicId}: ${result.result}`);
    }
    return result;
}

const deleteImages = async (imageUrls) => {
    const urls = [...new Set(imageUrls.filter((url) => typeof url === 'string' && url))];

    if (!urls.length) {
        return;
    }

    for (const imageUrl of urls) {
        const publicId = getPublicId(imageUrl);

        if (!publicId) {
            continue;
        }

        await deleteImage(publicId);
    }
}

const deleteProductWithVariantsImages = async (product, variants) => {
    const productImages = product?.images || [];
    const productVariants = variants || await Variant.find({
        productId: product._id,
        isDeleted: false,
    }).select('image').lean();
    const imageUrls = [...productImages, ...productVariants.map((variant) => variant.image)];
    await deleteImages(imageUrls);
}

module.exports = {
    deleteProductWithVariantsImages,
    deleteImages,
}