const Product = require('../models/Product');
const Variant = require('../models/Variant');
const { success, error } = require('../utils/responses');
const { withMongoTransaction } = require('../config/db');
const { STATUS, APPROVE_STATUS } = require('../constants/enums');
const { recomputeProductSummary } = require('../utils/product');
const {
    createProductDocuments,
    listProducts,
    getProductDetails,
    updateProductDocuments,
    addSingleVariant,
    updateSingleVariant,
    deleteSingleVariant,
    updateVariantStatus: serviceUpdateVariantStatus,
    updateVariantApproval: serviceUpdateVariantApproval,
    updateProductApproval: serviceUpdateProductApproval,
} = require('../services/product.service');

async function createProduct(req, res, next) {
    try {
        const {
            title,
            name,
            categoryId,
            description,
            image,
            images,
            options,
            variants,
            price,
            stock,
            sku,
            simplePrice,
            simpleStock,
            simpleSku,
            isFeatured,
            status,
            isActive,
        } = req.body;

        const productTitle = title || name;
        const resolvedPrice = price !== undefined ? price : simplePrice;
        const resolvedStock = stock !== undefined ? stock : simpleStock;
        const resolvedSku = sku || simpleSku;

        let galleryImages = Array.isArray(images) ? images : [];
        if (galleryImages.length === 0 && image) {
            galleryImages = [image];
        }

        const productVariants = Array.isArray(variants) && variants.length > 0
            ? variants
            : [{
                price: resolvedPrice,
                stock: resolvedStock,
                sku: resolvedSku,
                attributes: {},
                image: image || (galleryImages[0] || ''),
            }];

        const product = await withMongoTransaction((session) =>
            createProductDocuments(
                {
                    storeId: req.store._id,
                    categoryId,
                    title: productTitle,
                    description: description || '',
                    image: galleryImages[0] || image || '',
                    images: galleryImages,
                    options: options || [],
                    isFeatured: isFeatured || false,
                    status: status || (isActive === false ? STATUS.IN_ACTIVE : STATUS.ACTIVE),
                    isActive: isActive !== undefined ? isActive : (status !== STATUS.IN_ACTIVE),
                    approveStatus: APPROVE_STATUS.APPROVED,
                },
                productVariants,
                session
            )
        );

        return success(res, 201, {
            message: 'Product created and submitted successfully',
            product,
        });
    } catch (err) {
        return next(err);
    }
}

async function getProducts(req, res, next) {
    return listProducts(req, res, next, false);
}

async function getPublicProducts(req, res, next) {
    return listProducts(req, res, next, false);
}

async function getSellerProducts(req, res, next) {
    return listProducts(req, res, next, false, req.store._id);
}

async function getAdminProducts(req, res, next) {
    return listProducts(req, res, next, true);
}

async function getProductById(req, res, next) {
    return getProductDetails(req, res, next, false);
}

async function getPublicProduct(req, res, next) {
    return getProductDetails(req, res, next, false);
}

async function getAdminProductById(req, res, next) {
    return getProductDetails(req, res, next, true);
}

async function updateProduct(req, res, next) {
    try {
        const {
            title,
            name,
            categoryId,
            description,
            image,
            images,
            options,
            variants,
            isFeatured,
            status,
            isActive,
        } = req.body;

        const productUpdates = {};
        if (title !== undefined) productUpdates.title = title;
        else if (name !== undefined) productUpdates.title = name;

        if (categoryId !== undefined) productUpdates.categoryId = categoryId;
        if (description !== undefined) productUpdates.description = description;

        if (images !== undefined) {
            productUpdates.images = images;
            if (images.length > 0 && !image) productUpdates.image = images[0];
        } else if (image !== undefined) {
            productUpdates.image = image;
            productUpdates.images = [image];
        }

        if (options !== undefined) productUpdates.options = options;
        if (isFeatured !== undefined) productUpdates.isFeatured = isFeatured;
        if (status !== undefined) {
            productUpdates.status = status;
            productUpdates.isActive = status === STATUS.ACTIVE;
        } else if (isActive !== undefined) {
            productUpdates.isActive = isActive;
            productUpdates.status = isActive ? STATUS.ACTIVE : STATUS.IN_ACTIVE;
        }

        const product = await withMongoTransaction((session) =>
            updateProductDocuments({
                id: req.params.id,
                storeId: req.store._id,
                productUpdates,
                variants,
                session,
            })
        );

        if (!product) {
            return error(res, 404, 'Product not found');
        }

        return success(res, 200, {
            message: 'Product updated successfully',
            product,
        });
    } catch (err) {
        return next(err);
    }
}

async function deleteProduct(req, res, next) {
    try {
        const product = await withMongoTransaction(async (session) => {
            const options = session ? { session } : {};
            const product = await Product.findOneAndUpdate(
                {
                    _id: req.params.id,
                    storeId: req.store._id,
                    isDeleted: false,
                },
                { $set: { isDeleted: true } },
                { new: true, ...options }
            );

            if (!product) return null;

            await Variant.updateMany(
                { productId: product._id, isDeleted: false },
                { $set: { isDeleted: true } },
                options
            );

            return product;
        });

        if (!product) {
            return error(res, 404, 'Product not found');
        }

        return success(res, 200, {
            message: 'Product deleted successfully',
        });
    } catch (err) {
        return next(err);
    }
}

async function updateProductStatus(req, res, next) {
    try {
        const newStatus = req.body.status || (req.body.isActive === false ? STATUS.IN_ACTIVE : STATUS.ACTIVE);

        const product = await withMongoTransaction(async (session) => {
            const options = session ? { session } : {};
            const product = await Product.findOneAndUpdate(
                { _id: req.params.id, storeId: req.store._id, isDeleted: false },
                {
                    $set: {
                        status: newStatus,
                        isActive: newStatus === STATUS.ACTIVE,
                    },
                },
                { new: true, runValidators: true, ...options }
            );
            if (!product) return null;

            await Variant.updateMany(
                { productId: product._id, isDeleted: false },
                {
                    $set: {
                        status: newStatus,
                        isActive: newStatus === STATUS.ACTIVE,
                    },
                },
                options
            );

            await recomputeProductSummary(product._id, session);

            const variantsQuery = Variant.find({ productId: product._id, isDeleted: false });
            if (session) variantsQuery.session(session);
            return { ...product.toObject(), variants: await variantsQuery.lean() };
        });

        if (!product) {
            return error(res, 404, 'Product not found');
        }

        return success(res, 200, {
            message: `Product status updated to ${newStatus}`,
            product,
        });
    } catch (err) {
        return next(err);
    }
}

async function updateProductApproval(req, res, next) {
    try {
        const result = await withMongoTransaction((session) =>
            serviceUpdateProductApproval({
                productId: req.params.id,
                approveStatus: req.body.approveStatus,
                session,
            })
        );

        return success(res, 200, {
            message: `Product approval status updated to ${req.body.approveStatus}`,
            product: result.product,
        });
    } catch (err) {
        return next(err);
    }
}

// ==========================================
// Sub-resource Variant Controllers
// ==========================================

async function addVariant(req, res, next) {
    try {
        const result = await withMongoTransaction((session) =>
            addSingleVariant({
                productId: req.params.id,
                storeId: req.store._id,
                variantData: req.body,
                session,
            })
        );

        return success(res, 201, {
            message: 'Variant added successfully',
            variant: result.variant,
            product: result.product,
        });
    } catch (err) {
        return next(err);
    }
}

async function updateVariant(req, res, next) {
    try {
        const result = await withMongoTransaction((session) =>
            updateSingleVariant({
                productId: req.params.id,
                variantId: req.params.variantId,
                storeId: req.store._id,
                variantUpdates: req.body,
                session,
            })
        );

        return success(res, 200, {
            message: 'Variant updated successfully',
            variant: result.variant,
            product: result.product,
        });
    } catch (err) {
        return next(err);
    }
}

async function deleteVariant(req, res, next) {
    try {
        const result = await withMongoTransaction((session) =>
            deleteSingleVariant({
                productId: req.params.id,
                variantId: req.params.variantId,
                storeId: req.store._id,
                session,
            })
        );

        return success(res, 200, {
            message: 'Variant deleted successfully',
            product: result.product,
        });
    } catch (err) {
        return next(err);
    }
}

async function updateVariantStatus(req, res, next) {
    try {
        const result = await withMongoTransaction((session) =>
            serviceUpdateVariantStatus({
                productId: req.params.id,
                variantId: req.params.variantId,
                storeId: req.store._id,
                status: req.body.status,
                session,
            })
        );

        return success(res, 200, {
            message: 'Variant status updated successfully',
            product: result.product,
        });
    } catch (err) {
        return next(err);
    }
}

async function updateVariantApproval(req, res, next) {
    try {
        const result = await withMongoTransaction((session) =>
            serviceUpdateVariantApproval({
                productId: req.params.id,
                variantId: req.params.variantId,
                approveStatus: req.body.approveStatus,
                session,
            })
        );

        return success(res, 200, {
            message: `Variant approval status updated to ${req.body.approveStatus}`,
            product: result.product,
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    createProduct,
    getProducts,
    getPublicProducts,
    getSellerProducts,
    getAdminProducts,
    getProductById,
    getPublicProduct,
    getAdminProductById,
    updateProduct,
    deleteProduct,
    updateProductStatus,
    updateProductApproval,
    addVariant,
    updateVariant,
    deleteVariant,
    updateVariantStatus,
    updateVariantApproval,
};
