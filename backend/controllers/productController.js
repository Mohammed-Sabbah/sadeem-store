const Product = require('../models/Product');
const Variant = require('../models/Variant');
const { success, error } = require('../utils/responses');
const { withMongoTransaction } = require('../config/db');
const {
    createProductDocuments,
    listProducts,
    getProductDetails,
    updateProductDocuments
} = require("../services/product.service")

async function createProduct(req, res, next) {
    try {
        const { title, description, images, variants, price, stock } = req.body;
        const productVariants = Array.isArray(variants) && variants.length > 0
            ? variants
            : [{ price, stock }];
        const product = await withMongoTransaction((session) =>
            createProductDocuments(
                {
                    storeId: req.store._id,
                    title,
                    description,
                    images,
                },
                productVariants,
                session
            )
        );

        return success(res, 201, {
            message: 'Product created successfully',
            product,
        });
    } catch (err) {
        return next(err);
    }
}

async function getProducts(req, res, next) {
    return listProducts(req, res, next);
}

async function getSellerProducts(req, res, next) {
    return listProducts(req, res, next, true, req.store._id);
}

async function getAdminProducts(req, res, next) {
    return listProducts(req, res, next, true);
}

async function getProductById(req, res, next) {
    return getProductDetails(req, res, next);
}

async function getAdminProductById(req, res, next) {
    return getProductDetails(req, res, next, true);
}

async function updateProduct(req, res, next) {
    try {
        const { title, description, images, variants } = req.body;
        const productUpdates = {};
        if (title !== undefined) productUpdates.title = title;
        if (description !== undefined) productUpdates.description = description;
        if (images !== undefined) productUpdates.images = images;

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
        const product = await Product.findOneAndUpdate(
            {
                _id: req.params.id,
                storeId: req.store._id,
                isDeleted: { $ne: true },
            },
            { $set: { isDeleted: true } },
            { new: true }
        );

        if (!product) {
            return error(res, 404, 'Product not found');
        }
        return success(res, 200, {
            message: 'Product deleted successfully',
            product,
        });
    } catch (err) {
        return next(err);
    }
}

async function updateProductAvailability(req, res, next) {
    try {
        const product = await withMongoTransaction(async (session) => {
            const options = session ? { session } : {};
            const product = await Product.findOneAndUpdate(
                { _id: req.params.id, storeId: req.store._id, isDeleted: { $ne: true } },
                { $set: { isActive: req.body.isActive } },
                { new: true, runValidators: true, ...options }
            );
            if (!product) return null;

            await Variant.updateMany(
                { productId: product._id },
                {
                    $set: {
                        isActive: product.isActive,
                        isSuspended: product.isSuspended,
                        suspensionReason: product.suspensionReason,
                    },
                },
                options
            );
            const variantsQuery = Variant.find({ productId: product._id });
            if (session) variantsQuery.session(session);
            return { ...product.toObject(), variants: await variantsQuery.lean() };
        });

        if (!product) {
            return error(res, 404, 'Product not found');
        }
        return success(res, 200, {
            message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
            product,
        });
    } catch (err) {
        return next(err);
    }
}

async function updateProductStatus(req, res, next) {
    try {
        const product = await withMongoTransaction(async (session) => {
            const options = session ? { session } : {};
            const statusUpdates = req.body.isSuspended
                ? {
                    isSuspended: true,
                    suspensionReason: req.body.suspensionReason,
                }
                : {
                    isSuspended: false,
                    suspensionReason: null,
                };
            const product = await Product.findByIdAndUpdate(
                { _id: req.params.id, isDeleted: { $ne: true } },
                { $set: statusUpdates },
                { new: true, runValidators: true, ...options }
            );
            if (!product) return null;

            await Variant.updateMany(
                { productId: product._id },
                {
                    $set: {
                        isActive: product.isActive,
                        isSuspended: product.isSuspended,
                        suspensionReason: product.suspensionReason,
                    },
                },
                options
            );
            const variantsQuery = Variant.find({ productId: product._id });
            if (session) variantsQuery.session(session);
            return { ...product.toObject(), variants: await variantsQuery.lean() };
        });

        if (!product) {
            return error(res, 404, 'Product not found');
        }
        return success(res, 200, {
            message: product.isSuspended
                ? `Product suspended: ${product.suspensionReason}`
                : 'Product suspension removed successfully',
            product,
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    createProduct,
    getProducts,
    getSellerProducts,
    getProductById,
    getAdminProducts,
    getAdminProductById,
    updateProduct,
    deleteProduct,
    updateProductAvailability,
    updateProductStatus,
};
