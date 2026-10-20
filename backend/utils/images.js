const validateNewProductImages = (product, updates) => {

    const previousImages = Array.isArray(product.images)
        ? product.images
        : [];

    const existingImages = Array.isArray(updates?.existingImages)
        ? updates.existingImages
        : [];

    const invalidImages = existingImages.filter(
        image => !previousImages.includes(image)
    );

    if (invalidImages.length > 0) {
        return false
    }

    const deletedImages = previousImages.filter(
        image => !existingImages.includes(image)
    );

    const uploadedImageUrls = Array.isArray(updates?.images) ? updates.images : []

    return {
        totalImages: [
            ...existingImages,
            ...uploadedImageUrls,
        ],
        deletedImages
    };

}

module.exports = {
    validateNewProductImages
}