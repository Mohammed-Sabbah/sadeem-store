const Product = require('../models/Product');
const Variant = require('../models/Variant');
const { APPROVE_STATUS, STATUS } = require('../constants/enums');
const { success, error } = require('../utils/responses');
const { getProductResponse } = require('../utils/product');
const {
    findDuplicateVariant,
    hasVariantAttributes,
    normalizeAttributes,
} = require('../utils/variant');

async function deactivateProductWithNoActiveVariants(product) {
    const hasActiveVariant = await Variant.exists({
        productId: product._id,
        status: STATUS.ACTIVE,
        isDeleted: false,
    });
    if (!hasActiveVariant && product.status !== STATUS.IN_ACTIVE) {
        product.status = STATUS.IN_ACTIVE;
        await product.save();
    }
}

async function addVariant(req, res, next) {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            storeId: req.store._id,
            isDeleted: false,
        })
            .populate('categoryId', 'variantAttributes');
        if (!product) {
            return error(res, 404, 'Product not found');
        }
        if (!product.categoryId) {
            return error(res, 409, 'This product no longer has a valid category');
        }

        const attributes = normalizeAttributes(
            req.body.attributes,
            product.categoryId.variantAttributes
        );
        if (attributes.error) {
            return error(res, 400, attributes.error);
        }
        const variants = await Variant.find({ productId: product._id, isDeleted: false });
        if (findDuplicateVariant(variants, attributes.attributes)) {
            return error(res, 409, 'A variant with these attributes already exists');
        }
        const image = req.body.image ?? req.uploadedImages?.[0] ?? product.images[0];
        if (!image) {
            return error(res, 400, 'A variant must have an image or the product must have at least one image');
        }
        const createdVariant = await Variant.create({
            productId: product._id,
            attributes: new Map(Object.entries(attributes.attributes)),
            price: req.body.price,
            stock: req.body.stock,
            image,
        });

        return success(res, 201, {
            message: 'Variant added and submitted for approval',
            variant: createdVariant,
            product: await getProductResponse(product),
        });
    } catch (err) {
        return next(err);
    }
}

async function updateVariant(req, res, next) {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            storeId: req.store._id,
            isDeleted: false,
        })
            .populate('categoryId', 'variantAttributes');
        if (!product) {
            return error(res, 404, 'Product not found');
        }
        if (!product.categoryId) {
            return error(res, 409, 'This product no longer has a valid category');
        }

        const variant = await Variant.findOne({
            _id: req.params.variantId,
            productId: product._id,
            isDeleted: false,
        });
        if (!variant) {
            return error(res, 404, 'Variant not found');
        }
        let updatedAttributes = variant.attributes;
        if (req.body.attributes !== undefined) {
            const result = normalizeAttributes(req.body.attributes, product.categoryId.variantAttributes);
            if (result.error) {
                return error(res, 400, result.error);
            }
            updatedAttributes = result.attributes;
        }
        const activeVariants = await Variant.find({ productId: product._id, isDeleted: false });
        if (!hasVariantAttributes(updatedAttributes) && activeVariants.length > 1) {
            return error(res, 400, 'Every variant must have category attributes once a product has multiple variants');
        }
        if (findDuplicateVariant(activeVariants, updatedAttributes, variant._id)) {
            return error(res, 409, 'A variant with these attributes already exists');
        }

        if (req.body.price !== undefined) variant.price = req.body.price;
        if (req.body.stock !== undefined) variant.stock = req.body.stock;
        if (req.body.attributes !== undefined) {
            variant.attributes = new Map(Object.entries(updatedAttributes));
        }
        if (req.body.status !== undefined) {
            variant.status = req.body.status;
        }

        const previousImage = variant.image;
        const image = req.body.image ?? req.uploadedImages?.[0];
        if (image !== undefined) {
            variant.image = image;
        }
        await variant.save();
        if (req.body.status === STATUS.IN_ACTIVE) {
            await deactivateProductWithNoActiveVariants(product);
        }
        // if (previousImage && previousImage !== variant.image) {
        //     await deleteUnusedImages([previousImage]);
        // }

        return success(res, 200, {
            message: 'Variant updated successfully',
            product: await getProductResponse(product),
        });
    } catch (err) {
        return next(err);
    }
}

async function updateVariantApproval(req, res, next) {
    try {
        if (
            req.body.approveStatus === APPROVE_STATUS.REJECTED &&
            (typeof req.body.reason !== 'string' || !req.body.reason.trim())
        ) {
            return error(res, 400, 'Rejection reason is required');
        }

        const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
        if (!product) {
            return error(res, 404, 'Product not found');
        }
        const variant = await Variant.findOne({
            _id: req.params.variantId,
            productId: product._id,
            isDeleted: false,
        });
        if (!variant) {
            return error(res, 404, 'Variant not found');
        }

        variant.approveStatus = req.body.approveStatus;
        variant.rejectionReason = req.body.approveStatus === APPROVE_STATUS.REJECTED
            ? req.body.reason.trim()
            : '';
        await variant.save();
        await product.populate('categoryId', 'title slug variantAttributes');
        await product.populate({ path: 'storeId', select: 'name' });
        return success(res, 200, { product: await getProductResponse(product) });
    } catch (err) {
        return next(err);
    }
}

async function deleteVariant(req, res, next) {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            storeId: req.store._id,
            isDeleted: false,
        });
        if (!product) {
            return error(res, 404, 'Product not found');
        }

        const variant = await Variant.findOne({
            _id: req.params.variantId,
            productId: product._id,
            isDeleted: false,
        });
        if (!variant) {
            return error(res, 404, 'Variant not found');
        }

        const image = variant.image;
        variant.image = '';
        variant.isDeleted = true;
        await variant.save();
        // if (image) {
        //     await deleteUnusedImages([image]);
        // }
        await deactivateProductWithNoActiveVariants(product);

        return success(res, 200, {
            message: 'Variant deleted successfully',
            product: await getProductResponse(product),
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    addVariant,
    updateVariant,
    updateVariantApproval,
    deleteVariant,
};
