const Product = require('../models/Product');
const Variant = require('../models/Variant');
const { APPROVE_STATUS, STATUS } = require('../constants/enums');
const { success, error } = require('../utils/responses');
const { getProductResponse } = require('../utils/product');
const {
    findDuplicateVariant,
    hasVariantAttributes,
    normalizeAttributes,
    getVariantId,
    hasDuplicateIds,
    getRequestVariants,
    validateDocuments
} = require('../utils/variant');
const { deactivateProductWithNoActiveVariants } = require("../utils/product")
const { findProduct } = require("../services/product.service")

function getUploadedImage(req, variants, index) {
    const uploadIndex = variants
        .slice(0, index)
        .filter((variant) => variant.image === undefined)
        .length;
    return req.uploadedImages?.[uploadIndex];
}

async function createVariants(req, res, next) {
    try {
        const product = await findProduct(req, { populateCategory: true });
        if (!product) return error(res, 404, 'Product not found');
        if (!product.categoryId) {
            return error(res, 409, 'This product no longer has a valid category');
        }

        const submittedVariants = getRequestVariants(req);
        if (!submittedVariants.length) {
            return error(res, 400, 'At least one variant is required');
        }

        const existingVariants = await Variant.find({ productId: product._id, isDeleted: false });
        const variantsToCreate = [];
        for (const [index, submitted] of submittedVariants.entries()) {
            const attributes = normalizeAttributes(
                submitted.attributes,
                product.categoryId.variantAttributes
            );
            if (attributes.error) return error(res, 400, attributes.error);

            if (findDuplicateVariant(
                [...existingVariants, ...variantsToCreate],
                attributes.attributes
            )) {
                return error(res, 409, 'A variant with these attributes already exists');
            }

            const image = submitted.image ?? getUploadedImage(req, submittedVariants, index) ?? product.images[0];
            if (!image) {
                return error(res, 400, 'A variant must have an image or the product must have at least one image');
            }
            variantsToCreate.push(new Variant({
                productId: product._id,
                attributes: new Map(Object.entries(attributes.attributes)),
                price: submitted.price,
                stock: submitted.stock,
                image,
            }));
        }

        await validateDocuments(variantsToCreate);
        const createdVariants = await Variant.insertMany(variantsToCreate);

        return success(res, 201, {
            message: 'Variants added and submitted for approval',
            variants: createdVariants,
            product: await getProductResponse(product),
        });
    } catch (err) {
        return next(err);
    }
}

async function updateVariants(req, res, next) {
    try {
        const product = await findProduct(req, { populateCategory: true });
        if (!product) return error(res, 404, 'Product not found');
        if (!product.categoryId) {
            return error(res, 409, 'This product no longer has a valid category');
        }

        const updates = getRequestVariants(req);
        if (!updates.length) return error(res, 400, 'At least one variant is required');
        if (hasDuplicateIds(updates)) {
            return error(res, 400, 'A variant can only be updated once per request');
        }

        const activeVariants = await Variant.find({ productId: product._id, isDeleted: false });
        const activeById = new Map(activeVariants.map((variant) => [String(variant._id), variant]));
        const targetVariants = updates.map((update) => activeById.get(String(getVariantId(update))));
        if (targetVariants.some((variant) => !variant)) {
            return error(res, 404, 'Variant not found');
        }

        const updateById = new Map(updates.map((update) => [String(getVariantId(update)), update]));
        for (const variant of targetVariants) {
            const update = updateById.get(String(variant._id));
            if (update.attributes !== undefined) {
                const result = normalizeAttributes(update.attributes, product.categoryId.variantAttributes);
                if (result.error) return error(res, 400, result.error);
                variant.attributes = new Map(Object.entries(result.attributes));
            }
            if (update.price !== undefined) variant.price = update.price;
            if (update.stock !== undefined) variant.stock = update.stock;
            if (update.status !== undefined) variant.status = update.status;
            const image = update.image ?? getUploadedImage(req, updates, updates.indexOf(update));
            if (image !== undefined) variant.image = image;
        }

        for (const variant of targetVariants) {
            if (activeVariants.length > 1 && !hasVariantAttributes(variant.attributes)) {
                return error(res, 400, 'Every variant must have category attributes once a product has multiple variants');
            }
            if (findDuplicateVariant(activeVariants, variant.attributes, variant._id)) {
                return error(res, 409, 'A variant with these attributes already exists');
            }
        }

        await validateDocuments(targetVariants);
        await Promise.all(targetVariants.map((variant) => variant.save()));
        if (updates.some((update) => update.status === STATUS.IN_ACTIVE)) {
            await deactivateProductWithNoActiveVariants(product);
        }

        return success(res, 200, {
            message: 'Variants updated successfully',
            variants: targetVariants,
            product: await getProductResponse(product),
        });
    } catch (err) {
        return next(err);
    }
}

async function updateVariantsApproval(req, res, next) {
    try {
        const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
        if (!product) return error(res, 404, 'Product not found');

        const updates = getRequestVariants(req);
        if (!updates.length) return error(res, 400, 'At least one variant is required');
        if (hasDuplicateIds(updates)) {
            return error(res, 400, 'A variant can only be updated once per request');
        }
        for (const update of updates) {
            if (
                update.approveStatus === APPROVE_STATUS.REJECTED &&
                (typeof update.reason !== 'string' || !update.reason.trim())
            ) {
                return error(res, 400, 'Rejection reason is required');
            }
        }

        const ids = updates.map(getVariantId);
        const variants = await Variant.find({
            _id: { $in: ids },
            productId: product._id,
            isDeleted: false,
        });
        const variantById = new Map(variants.map((variant) => [String(variant._id), variant]));
        if (updates.some((update) => !variantById.has(String(getVariantId(update))))) {
            return error(res, 404, 'Variant not found');
        }

        for (const update of updates) {
            const variant = variantById.get(String(getVariantId(update)));
            variant.approveStatus = update.approveStatus;
            variant.rejectReason = update.approveStatus === APPROVE_STATUS.REJECTED
                ? update.reason.trim()
                : '';
        }
        await validateDocuments(variants);
        await Promise.all(variants.map((variant) => variant.save()));

        await product.populate('categoryId', 'title slug variantAttributes');
        await product.populate({ path: 'storeId', select: 'name' });
        return success(res, 200, { product: await getProductResponse(product) });
    } catch (err) {
        return next(err);
    }
}

async function deleteVariants(req, res, next) {
    try {
        const product = await findProduct(req);
        if (!product) return error(res, 404, 'Product not found');

        const submittedVariants = getRequestVariants(req);
        const ids = submittedVariants.map(getVariantId);
        if (!ids.length) return error(res, 400, 'At least one variant is required');

        const uniqueIds = [...new Set(ids.map(String))];
        const variants = await Variant.find({
            _id: { $in: uniqueIds },
            productId: product._id,
        });
        const variantById = new Map(variants.map((variant) => [String(variant._id), variant]));
        if (uniqueIds.some((id) => !variantById.has(id))) {
            return error(res, 404, 'Variant not found');
        }

        const variantsToDelete = uniqueIds
            .map((id) => variantById.get(id))
            .filter((variant) => !variant.isDeleted);
        for (const variant of variantsToDelete) {
            variant.image = '';
            variant.isDeleted = true;
        }
        await validateDocuments(variantsToDelete);
        await Promise.all(variantsToDelete.map((variant) => variant.save()));
        if (variantsToDelete.length > 0) {
            await deactivateProductWithNoActiveVariants(product);
        }

        await product.populate('categoryId', 'title slug variantAttributes');
        await product.populate({ path: 'storeId', select: 'name' });

        return success(res, 200, {
            message: variantsToDelete.length === 1
                ? 'Variant deleted successfully'
                : 'Variants deleted successfully',
            product: await getProductResponse(product),
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    createVariants,
    updateVariants,
    updateVariantsApproval,
    deleteVariants,
};
