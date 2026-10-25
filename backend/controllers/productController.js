const Category = require('../models/Category');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const { APPROVE_STATUS, STATUS } = require('../constants/enums');
const { success, error } = require('../utils/responses');

const {
    getProductResponse,
    getProductsWithVariants,
} = require('../utils/product');

const {
    hasActiveVariants,
    hasVariantAttributes,
    prepareProductVariants,
    getDefaultVariant
} = require('../utils/variant');

const productService = require("../services/product.service")

// Public Filters
const publicProductFilter = {
    isDeleted: false,
    status: STATUS.ACTIVE,
    approveStatus: APPROVE_STATUS.APPROVED,
};

const publicVariantFilter = {
    isDeleted: false,
    status: STATUS.ACTIVE,
    approveStatus: APPROVE_STATUS.APPROVED,
};

async function getPublicProducts(req, res, next) {
    try {
        const activeProductIds = await Variant.distinct('productId', publicVariantFilter);
        const filter = { ...publicProductFilter, _id: { $in: activeProductIds } };
        if (req.query.categoryId) {
            filter.categoryId = req.query.categoryId;
        }
        if (req.query.storeId) {
            filter.storeId = req.query.storeId;
        }

        const products = await Product.find(filter)
            .populate({
                path: 'categoryId',
                select: 'title slug variantAttributes',
                match: { isActive: true },
            })
            .populate({
                path: 'storeId',
                select: 'name logo address status approveStatus isDeleted',
                match: { status: STATUS.ACTIVE, approveStatus: APPROVE_STATUS.APPROVED, isDeleted: false },
            })
            .sort({ createdAt: -1 });
        return success(res, 200, {
            products: await getProductsWithVariants(products),
            count: products.length,
        });
    } catch (err) {
        return next(err);
    }
}

async function getPublicProduct(req, res, next) {
    try {
        const hasPublicVariant = await Variant.exists({
            productId: req.params.id,
            ...publicVariantFilter,
        });
        const product = hasPublicVariant && await Product.findOne({
            _id: req.params.id,
            ...publicProductFilter,
        })
            .populate({
                path: 'categoryId',
                select: 'title slug variantAttributes',
                match: { isActive: true },
            })
            .populate({
                path: 'storeId',
                select: 'name logo address status approveStatus isDeleted',
                match: { status: STATUS.ACTIVE, approveStatus: APPROVE_STATUS.APPROVED, isDeleted: false },
            });

        if (!product || !product.storeId || !product.categoryId) {
            return error(res, 404, 'Product not found');
        }

        const publicProduct = await getProductResponse(product);

        return success(res, 200, { product: publicProduct });
    } catch (err) {
        return next(err);
    }
}

async function getSellerProducts(req, res, next) {
    try {
        const products = await Product.find({ storeId: req.store._id, isDeleted: false })
            .populate('categoryId', 'title slug variantAttributes')
            .sort({ createdAt: -1 });

        return success(res, 200, {
            products: await getProductsWithVariants(products),
            count: products.length,
        });
    } catch (err) {
        return next(err);
    }
}

async function getAdminProducts(req, res, next) {
    try {
        const products = await Product.find({ isDeleted: false })
            .populate('categoryId', 'title slug variantAttributes')
            .populate({ path: 'storeId', select: 'name' })
            .sort({ createdAt: -1 });

        return success(res, 200, {
            products: await getProductsWithVariants(products),
            count: products.length,
        });
    } catch (err) {
        return next(err);
    }
}

async function getAdminProductById(req, res, next) {
    try {
        const product = await Product.findOne({ _id: req.params.id, isDeleted: false })
            .populate('categoryId', 'title slug variantAttributes')
            .populate({ path: 'storeId', select: 'name logo address status approveStatus balance' });

        if (!product) {
            return error(res, 404, 'Product not found');
        }

        const productWithVariants = await getProductResponse(product);

        return success(res, 200, {
            product: productWithVariants,
        });
    } catch (err) {
        return next(err);
    }
}


async function createProduct(req, res, next) {
    try {
        const { title, description, price, stock, variants } = req.body || {}
        const category = await Category.findOne({ _id: req.body.categoryId, isActive: true });
        if (!category) {
            return error(res, 400, 'Select an active category');
        }

        const images = req.body.images || [];

        const hasCustomizedVariants = Array.isArray(variants) && variants.length > 0;

        const submittedVariants = hasCustomizedVariants
            ? variants
            : [getDefaultVariant(price, stock, images[0])];

        const { variantsToCreate, err } = prepareProductVariants(
            submittedVariants,
            category,
            hasCustomizedVariants,
            images[0]
        );
        if (err) return error(res, err.code, err.msg);

        const product = await productService.createProductWithVariants({
            storeId: req.store._id,
            title: title,
            description: description || '',
            categoryId: category._id,
            images,
        }, variantsToCreate);

        return success(res, 201, {
            message: 'Product created.',
            product: await getProductResponse(product),
        });
    } catch (err) {
        return next(err);
    }
}

async function updateProduct(req, res, next) {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            storeId: req.store._id,
            isDeleted: false,
        });
        if (!product) {
            return error(res, 404, 'Product not found');
        }

        if (
            req.body.status === STATUS.ACTIVE &&
            !(await hasActiveVariants(product._id))
        ) {
            return error(res, 409, 'Add at least one variant before activating this product');
        }
        if (req.body.status !== undefined) {
            product.status = req.body.status;
        }
        if (
            req.body.status !== undefined &&
            req.body.existingImages === undefined &&
            req.body.images === undefined
        ) {
            req.body.existingImages = product.images;
        }

        // if Category has Changed.
        if (req.body.categoryId && String(req.body.categoryId) !== String(product.categoryId)) {
            const variants = await Variant.find({ productId: product._id, isDeleted: false });
            const hasConfiguredVariants = variants.some((variant) =>
                hasVariantAttributes(variant.attributes)
            );
            if (hasConfiguredVariants) {
                return error(
                    res,
                    409,
                    'Category cannot be changed while this product has variants. Create a new product in the new category.'
                );
            }

            const category = await Category.findOne({ _id: req.body.categoryId, isActive: true });
            if (!category) {
                return error(res, 400, 'Select an active category');
            }
        }

        const updatedProduct = await productService.updateProduct(product, req.body);

        return success(res, 200, {
            message: 'Product updated successfully',
            product: await getProductResponse(updatedProduct),
        });
    } catch (err) {
        return next(err);
    }
}

async function updateProductApproval(req, res, next) {
    try {
        if (
            req.body.approveStatus === APPROVE_STATUS.REJECTED &&
            (typeof req.body.reason !== 'string' || !req.body.reason.trim())
        ) {
            return error(res, 400, 'Rejection reason is required');
        }

        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            {
                $set: {
                    approveStatus: req.body.approveStatus,
                    rejectReason: req.body.approveStatus === APPROVE_STATUS.REJECTED
                        ? req.body.rejectReason.trim()
                        : '',
                },
            },
            { new: true, runValidators: true }
        )
            .populate('categoryId', 'title slug variantAttributes')
            .populate({ path: 'storeId', select: 'name' });
        if (!product) {
            return error(res, 404, 'Product not found');
        }
        return success(res, 200, { product: await getProductResponse(product) });
    } catch (err) {
        return next(err);
    }
}

async function deleteProduct(req, res, next) {
    try {
        const deletedProduct = await productService.deleteProductWithVariants(
            req.params.id,
            req.store._id
        );
        if (!deletedProduct) {
            return error(res, 404, 'Product not found');
        }
        return success(res, 200, { msg: 'Product deleted successfully' });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getPublicProducts,
    getPublicProduct,
    getSellerProducts,
    getAdminProducts,
    getAdminProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductApproval,
};
