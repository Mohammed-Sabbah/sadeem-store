const Category = require('../models/Category');
const Product = require('../models/Product');
const { APPROVE_STATUS, STATUS } = require('../constants/enums');
const { success, error } = require('../utils/responses');
const {
    findDuplicateVariant,
    hasVariantAttributes,
    normalizeAttributes,
    toProductResponse,
} = require('../utils/product');

const publicProductFilter = {
    isDeleted: false,
    status: STATUS.ACTIVE,
    approveStatus: APPROVE_STATUS.APPROVED,
    variants: {
        $elemMatch: {
            isDeleted: false,
            status: STATUS.ACTIVE,
            approveStatus: APPROVE_STATUS.APPROVED,
        },
    },
};

async function getPublicProducts(req, res, next) {
    try {
        const filter = { ...publicProductFilter };
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
            products: products.map((product) => toProductResponse(product)),
            count: products.length,
        });
    } catch (err) {
        return next(err);
    }
}

async function getPublicProduct(req, res, next) {
    try {
        const product = await Product.findOne({
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

        const publicProduct = toProductResponse(product);

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
            products: products.map(product => toProductResponse(product)),
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
            products: products.map((product) => toProductResponse(product)),
            count: products.length,
        });
    } catch (err) {
        return next(err);
    }
}

async function createProduct(req, res, next) {
    try {
        const category = await Category.findOne({ _id: req.body.categoryId, isActive: true });
        if (!category) {
            return error(res, 400, 'Select an active category');
        }

        const product = await Product.create({
            storeId: req.store._id,
            title: req.body.title,
            description: req.body.description || '',
            categoryId: category._id,
            image: req.body.image,
            variants: [{
                attributes: {},
                price: req.body.price,
                stock: req.body.stock,
            }],
        });

        return success(res, 201, {
            message: 'Product created and submitted for approval',
            product: toProductResponse(product),
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

        if (req.body.categoryId && String(req.body.categoryId) !== String(product.categoryId)) {
            const hasConfiguredVariants = product.variants.some(
                (variant) => variant.isDeleted !== true && hasVariantAttributes(variant.attributes)
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

        for (const [field, value] of Object.entries(req.body)) {
            product[field] = value;
        }
        await product.save();

        return success(res, 200, {
            message: 'Product updated successfully',
            product: toProductResponse(product),
        });
    } catch (err) {
        return next(err);
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
        if (findDuplicateVariant(product.variants, attributes.attributes)) {
            return error(res, 409, 'A variant with these attributes already exists');
        }

        product.variants.push({
            attributes: new Map(Object.entries(attributes.attributes)),
            price: req.body.price,
            stock: req.body.stock,
        });
        await product.save();

        return success(res, 201, {
            message: 'Variant added and submitted for approval',
            product: toProductResponse(product),
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

        const variant = product.variants.id(req.params.variantId);
        if (!variant || variant.isDeleted) {
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
        const activeVariants = product.variants.filter((item) => item.isDeleted == false);
        if (!hasVariantAttributes(updatedAttributes) && activeVariants.length > 1) {
            return error(res, 400, 'Every variant must have category attributes once a product has multiple variants');
        }
        if (findDuplicateVariant(product.variants, updatedAttributes, variant._id)) {
            return error(res, 409, 'A variant with these attributes already exists');
        }

        if (req.body.price !== undefined) variant.price = req.body.price;
        if (req.body.stock !== undefined) variant.stock = req.body.stock;
        if (req.body.attributes !== undefined) {
            variant.attributes = new Map(Object.entries(updatedAttributes));
        }

        await product.save();

        return success(res, 200, {
            message: 'Variant updated successfully',
            product: toProductResponse(product),
        });
    } catch (err) {
        return next(err);
    }
}

async function updateProductStatus(req, res, next) {
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
            !product.variants.some((variant) => variant.isDeleted == false)
        ) {
            return error(res, 409, 'Add at least one variant before activating this product');
        }

        product.status = req.body.status;
        await product.save();
        return success(res, 200, { product: toProductResponse(product) });
    } catch (err) {
        return next(err);
    }
}

async function updateVariantStatus(req, res, next) {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            storeId: req.store._id,
            isDeleted: false,
        });
        if (!product) {
            return error(res, 404, 'Product not found');
        }
        const variant = product.variants.id(req.params.variantId);
        if (!variant || variant.isDeleted) {
            return error(res, 404, 'Variant not found');
        }

        variant.status = req.body.status;
        await product.save();
        return success(res, 200, { product: toProductResponse(product) });
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

        const variant = product.variants.id(req.params.variantId);
        if (!variant || variant.isDeleted) {
            return error(res, 404, 'Variant not found');
        }

        variant.isDeleted = true;
        const hasRemainingVariants = product.variants.some((item) => item.isDeleted !== true);
        if (!hasRemainingVariants) {
            product.status = STATUS.IN_ACTIVE;
        }

        await product.save();

        return success(res, 200, {
            message: 'Variant deleted successfully',
            product: toProductResponse(product),
        });
    } catch (err) {
        return next(err);
    }
}

async function deleteProduct(req, res, next) {
    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, isDeleted: { $ne: true } },
            { $set: { isDeleted: true } },
            { new: true }
        );

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

async function updateProductApproval(req, res, next) {
    try {
        const product = await Product.findByIdAndUpdate(
            { _id: req.params.id, isDeleted: false },
            { $set: { approveStatus: req.body.approveStatus } },
            { new: true, runValidators: true }
        )
            .populate('categoryId', 'title slug variantAttributes')
            .populate({ path: 'storeId', select: 'name' });
        if (!product) {
            return error(res, 404, 'Product not found');
        }
        return success(res, 200, { product: toProductResponse(product) });
    } catch (err) {
        return next(err);
    }
}

async function updateVariantApproval(req, res, next) {
    try {
        const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
        if (!product) {
            return error(res, 404, 'Product not found');
        }
        const variant = product.variants.id(req.params.variantId);
        if (!variant || variant.isDeleted) {
            return error(res, 404, 'Variant not found');
        }

        variant.approveStatus = req.body.approveStatus;
        await product.save();
        await product.populate('categoryId', 'title slug variantAttributes');
        await product.populate({ path: 'storeId', select: 'name' });
        return success(res, 200, { product: toProductResponse(product) });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getPublicProducts,
    getPublicProduct,
    getSellerProducts,
    getAdminProducts,
    createProduct,
    updateProduct,
    addVariant,
    updateVariant,
    deleteVariant,
    updateProductStatus,
    updateVariantStatus,
    deleteProduct,
    updateProductApproval,
    updateVariantApproval,
};
