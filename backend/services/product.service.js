const mongoose = require('mongoose');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const Category = require('../models/Category');
const Store = require('../models/Store');
const User = require('../models/User');
const { STATUS, APPROVE_STATUS, ROLE } = require('../constants/enums');
const { success, error } = require('../utils/responses');
const { roundMoney } = require('../utils/money');
const {
    createProductFilter,
    recomputeProductSummary,
    generateVariantSku,
    normalizeAttributes,
    findDuplicateVariant,
    hasVariantAttributes,
    toProductResponse,
} = require('../utils/product');

const MAX_VARIANTS_PER_PRODUCT = 100;

/**
 * تجهيز وتنظيف بيانات الصنف (Variant) والتحقق من قيود المال والمخزون والـ SKU
 */
function prepareVariantPayload(rawVariant, productTitle, index = 1, storeId = null) {
    const variant = { ...rawVariant };

    if (!variant.attributes || typeof variant.attributes !== 'object') {
        variant.attributes = {};
    }

    if (variant.color && !variant.attributes['اللون'] && !variant.attributes['color']) {
        variant.attributes['اللون'] = variant.color;
    }
    if (variant.size && !variant.attributes['المقاس'] && !variant.attributes['size']) {
        variant.attributes['المقاس'] = variant.size;
    }

    if (!variant.sku || !String(variant.sku).trim()) {
        variant.sku = generateVariantSku(productTitle, variant.attributes, index);
    } else {
        variant.sku = String(variant.sku).trim().toUpperCase();
    }

    variant.price = roundMoney(variant.price || 0);
    variant.stock = Math.max(0, Math.floor(Number(variant.stock) || 0));

    if (variant.compareAtPrice !== undefined && variant.compareAtPrice !== null && String(variant.compareAtPrice).trim() !== '') {
        const compareVal = roundMoney(variant.compareAtPrice);
        if (compareVal <= variant.price) {
            const err = new Error(`السعر قبل الخصم (${compareVal} ₪) يجب أن يكون أكبر من سعر البيع (${variant.price} ₪)`);
            err.statusCode = 400;
            throw err;
        }
        variant.compareAtPrice = compareVal;
    } else {
        variant.compareAtPrice = null;
    }

    if (Array.isArray(variant.images)) {
        variant.images = variant.images.filter(Boolean).map(String);
        if (variant.images.length > 0 && !variant.image) {
            variant.image = variant.images[0];
        }
    } else if (variant.image) {
        variant.images = [String(variant.image)];
    } else {
        variant.images = [];
        variant.image = '';
    }

    if (storeId) {
        variant.storeId = storeId;
    }

    if (variant.status) {
        variant.isActive = variant.status === STATUS.ACTIVE;
    } else if (variant.isActive !== undefined) {
        variant.status = variant.isActive ? STATUS.ACTIVE : STATUS.IN_ACTIVE;
    } else {
        variant.status = STATUS.ACTIVE;
        variant.isActive = true;
    }

    if (!variant.approveStatus) {
        variant.approveStatus = APPROVE_STATUS.APPROVED;
    }

    return variant;
}

/**
 * التحقق من قيود الخيارات والأصناف المسموحة للتصنيف والحد الأقصى (100)
 */
async function validateProductOptionsAndVariants({ categoryId, options, variants }) {
    if (Array.isArray(variants) && variants.length > MAX_VARIANTS_PER_PRODUCT) {
        const err = new Error(`لا يمكن إضافة أكثر من ${MAX_VARIANTS_PER_PRODUCT} صنف للمنتج الواحد`);
        err.statusCode = 400;
        throw err;
    }

    if (categoryId && Array.isArray(options) && options.length > 0) {
        const allowedKeys = await Category.resolveAllowedOptions(categoryId);
        if (allowedKeys && allowedKeys.length > 0) {
            const allowedSet = new Set(allowedKeys.map((k) => String(k).toLowerCase().trim()));
            for (const opt of options) {
                if (opt.source === 'DEFINED' && opt.key && !allowedSet.has(String(opt.key).toLowerCase().trim())) {
                    // المرونة مع الخيارات المخصصة
                }
            }
        }
    }
}

/**
 * إنشاء مستندات المنتج والأصناف التابعة له في دفعة واحدة (Batch Creation)
 */
async function createProductDocuments(productData, rawVariants, session = null) {
    const options = session ? { session } : {};
    let product = null;

    await validateProductOptionsAndVariants({
        categoryId: productData.categoryId,
        options: productData.options,
        variants: rawVariants,
    });

    try {
        const payloadToCreate = { ...productData };
        if (Array.isArray(payloadToCreate.images) && payloadToCreate.images.length > 0 && !payloadToCreate.image) {
            payloadToCreate.image = payloadToCreate.images[0];
        }

        if (payloadToCreate.slug) {
            const existingSlug = await Product.findOne({
                storeId: payloadToCreate.storeId,
                slug: payloadToCreate.slug,
                isDeleted: false,
            }).session(session || null);

            if (existingSlug) {
                payloadToCreate.slug = `${payloadToCreate.slug}-${Math.floor(100 + Math.random() * 900)}`;
            }
        }

        [product] = await Product.create([payloadToCreate], options);

        const variantsToCreate = (rawVariants || []).map((raw, idx) => {
            const prepared = prepareVariantPayload(raw, product.title, idx + 1, product.storeId);
            return {
                ...prepared,
                productId: product._id,
                storeId: product.storeId,
            };
        });

        const createdVariants = variantsToCreate.length > 0
            ? await Variant.create(variantsToCreate, options)
            : [];

        // احتساب ملخص الأسعار والمخزون آلياً
        await recomputeProductSummary(product._id, session);

        const freshProduct = await Product.findById(product._id)
            .populate('storeId', 'name logo address')
            .populate('categoryId', 'title slug icon allowedOptions variantAttributes')
            .session(session || null)
            .lean();

        return toProductResponse(freshProduct, createdVariants);
    } catch (err) {
        if (!session && product) {
            try {
                await Variant.deleteMany({ productId: product._id });
                await Product.deleteOne({ _id: product._id });
            } catch (cleanupErr) {
                console.error('Rollback cleanup error in createProductDocuments:', cleanupErr);
            }
        }
        throw err;
    }
}

/**
 * تحديث بيانات المنتج وأصنافه في دفعة واحدة (Batch Update)
 */
async function updateProductDocuments({ id, storeId, productUpdates, variants, session = null }) {
    const options = session ? { session } : {};
    const productQuery = Product.findOne({ _id: id, storeId, isDeleted: false });
    if (session) productQuery.session(session);
    const product = await productQuery;
    if (!product) return null;

    if (variants && Array.isArray(variants)) {
        await validateProductOptionsAndVariants({
            categoryId: productUpdates?.categoryId || product.categoryId,
            options: productUpdates?.options || product.options,
            variants,
        });

        const originalVariants = await Variant.find({ productId: product._id, isDeleted: false })
            .select('_id')
            .session(session || null)
            .lean();
        const originalVariantIds = originalVariants.map((v) => v._id);

        const requestedExistingIds = variants
            .filter((v) => v._id || v.id)
            .map((v) => String(v._id || v.id));

        const existingFound = await Variant.find({
            _id: { $in: requestedExistingIds },
            productId: product._id,
        }).session(session || null);

        const existingIdsSet = new Set(existingFound.map((v) => String(v._id)));
        const variantsToUpdate = variants.filter((v) => (v._id || v.id) && existingIdsSet.has(String(v._id || v.id)));
        const variantsToCreate = variants.filter((v) => !((v._id || v.id) && existingIdsSet.has(String(v._id || v.id))));

        try {
            const newVariantsPayload = variantsToCreate
                .map((raw, idx) => {
                    const prepared = prepareVariantPayload(raw, productUpdates?.title || product.title, idx + 1, product.storeId);
                    return {
                        ...prepared,
                        productId: product._id,
                        storeId: product.storeId,
                        isActive: product.isActive,
                        isSuspended: product.isSuspended,
                    };
                });

            const createdVariants = newVariantsPayload.length > 0
                ? await Variant.create(newVariantsPayload, options)
                : [];

            const updatedVariantIds = [];

            for (const v of variantsToUpdate) {
                const variantId = v._id || v.id;
                const updates = { ...v };
                delete updates._id;
                delete updates.id;
                delete updates.productId;
                delete updates.storeId;
                delete updates.isDeleted;
                delete updates.isSuspended;
                delete updates.suspensionReason;
                delete updates.approveStatus;
                delete updates.createdAt;
                delete updates.updatedAt;
                delete updates.__v;

                if (updates.status && updates.isActive === undefined) {
                    const s = String(updates.status).toLowerCase();
                    updates.isActive = s === 'active';
                    updates.status = updates.isActive ? STATUS.ACTIVE : STATUS.IN_ACTIVE;
                } else if (updates.isActive !== undefined) {
                    updates.status = updates.isActive ? STATUS.ACTIVE : STATUS.IN_ACTIVE;
                }

                if (updates.sku) updates.sku = String(updates.sku).trim().toUpperCase();
                if (updates.price !== undefined) updates.price = roundMoney(updates.price);
                if (updates.stock !== undefined) updates.stock = Math.max(0, Math.floor(Number(updates.stock) || 0));
                if (updates.compareAtPrice !== undefined) {
                    updates.compareAtPrice = updates.compareAtPrice ? roundMoney(updates.compareAtPrice) : null;
                }
                if (Array.isArray(updates.images)) {
                    updates.images = updates.images.filter(Boolean).map(String);
                    updates.image = updates.images[0] || '';
                } else if (updates.image) {
                    updates.images = [String(updates.image)];
                }
                updates.storeId = product.storeId;

                const updated = await Variant.findOneAndUpdate(
                    { _id: variantId, productId: product._id },
                    { $set: { ...updates, isDeleted: false } },
                    { new: true, runValidators: true, ...options }
                );

                if (updated) {
                    updatedVariantIds.push(updated._id);
                }
            }

            const retainedIds = [
                ...updatedVariantIds,
                ...createdVariants.map((v) => v._id),
            ];

            // الحذف الناعم (Soft Delete) للأصناف المستثناة
            await Variant.updateMany(
                {
                    productId: product._id,
                    _id: { $nin: retainedIds },
                    isDeleted: false,
                },
                { $set: { isDeleted: true } },
                options
            );
        } catch (err) {
            if (!session) {
                try {
                    await Variant.deleteMany({
                        productId: product._id,
                        _id: { $nin: originalVariantIds },
                    });
                } catch (cleanupErr) {
                    console.error('Rollback cleanup error in updateProductDocuments:', cleanupErr);
                }
            }
            throw err;
        }
    }

    if (!variants && (productUpdates?.stock !== undefined || productUpdates?.price !== undefined || productUpdates?.compareAtPrice !== undefined)) {
        const variantUpdates = {};
        if (productUpdates.stock !== undefined) {
            variantUpdates.stock = Math.max(0, Math.floor(Number(productUpdates.stock) || 0));
            delete productUpdates.stock;
        }
        if (productUpdates.price !== undefined) {
            variantUpdates.price = roundMoney(productUpdates.price);
            delete productUpdates.price;
        }
        if (productUpdates.compareAtPrice !== undefined) {
            if (productUpdates.compareAtPrice !== null && String(productUpdates.compareAtPrice).trim() !== '') {
                const cmp = roundMoney(productUpdates.compareAtPrice);
                const effectivePrice = variantUpdates.price !== undefined ? variantUpdates.price : product.minPrice;
                if (cmp <= effectivePrice) {
                    const err = new Error(`السعر قبل الخصم (${cmp} ₪) يجب أن يكون أكبر من سعر البيع (${effectivePrice} ₪)`);
                    err.statusCode = 400;
                    throw err;
                }
                variantUpdates.compareAtPrice = cmp;
            } else {
                variantUpdates.compareAtPrice = null;
            }
            delete productUpdates.compareAtPrice;
        }
        await Variant.updateMany(
            { productId: product._id, isDeleted: false },
            { $set: variantUpdates },
            options
        );
    }

    if (productUpdates && Object.keys(productUpdates).length > 0) {
        Object.assign(product, productUpdates);
        await product.save(options);
    }

    // إعادة احتساب الملخص
    await recomputeProductSummary(product._id, session);

    const updatedProduct = await Product.findById(product._id)
        .populate('storeId', 'name logo address')
        .populate('categoryId', 'title slug icon allowedOptions variantAttributes')
        .session(session || null)
        .lean();

    const activeVariants = await Variant.find({ productId: product._id, isDeleted: false })
        .session(session || null)
        .lean();

    return toProductResponse(updatedProduct, activeVariants);
}

/**
 * إضافة صنف مفرد جديد لمنتج قائم (Single Variant Sub-resource)
 */
async function addSingleVariant({ productId, storeId, variantData, session = null }) {
    const options = session ? { session } : {};
    const product = await Product.findOne({ _id: productId, storeId, isDeleted: false })
        .populate('categoryId', 'variantAttributes')
        .session(session || null);

    if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
    }

    const categoryDefinitions = product.categoryId?.variantAttributes || [];
    let normalizedAttrs = variantData.attributes || {};

    if (categoryDefinitions.length > 0 && hasVariantAttributes(normalizedAttrs)) {
        const normResult = normalizeAttributes(normalizedAttrs, categoryDefinitions);
        if (normResult.error) {
            const err = new Error(normResult.error);
            err.statusCode = 400;
            throw err;
        }
        normalizedAttrs = normResult.attributes;
    }

    const existingVariants = await Variant.find({ productId: product._id, isDeleted: false })
        .session(session || null)
        .lean();

    if (findDuplicateVariant(existingVariants, normalizedAttrs)) {
        const err = new Error('A variant with these attributes already exists');
        err.statusCode = 409;
        throw err;
    }

    const prepared = prepareVariantPayload(
        { ...variantData, attributes: normalizedAttrs },
        product.title,
        existingVariants.length + 1,
        storeId
    );

    const [createdVariant] = await Variant.create([
        {
            ...prepared,
            productId: product._id,
            storeId: product.storeId,
            isActive: product.isActive,
            isSuspended: product.isSuspended,
        },
    ], options);

    await recomputeProductSummary(product._id, session);

    const freshProduct = await Product.findById(product._id)
        .populate('storeId', 'name logo address')
        .populate('categoryId', 'title slug icon allowedOptions variantAttributes')
        .session(session || null)
        .lean();

    const allVariants = await Variant.find({ productId: product._id, isDeleted: false })
        .session(session || null)
        .lean();

    return {
        variant: createdVariant,
        product: toProductResponse(freshProduct, allVariants),
    };
}

/**
 * تحديث صنف مفرد لمنتج قائم (Update Single Variant)
 */
async function updateSingleVariant({ productId, variantId, storeId, variantUpdates, session = null }) {
    const options = session ? { session } : {};
    const product = await Product.findOne({ _id: productId, storeId, isDeleted: false })
        .populate('categoryId', 'variantAttributes')
        .session(session || null);

    if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
    }

    const variant = await Variant.findOne({ _id: variantId, productId: product._id, isDeleted: false })
        .session(session || null);

    if (!variant) {
        const err = new Error('Variant not found');
        err.statusCode = 404;
        throw err;
    }

    if (variantUpdates.attributes !== undefined) {
        const categoryDefinitions = product.categoryId?.variantAttributes || [];
        let normalizedAttrs = variantUpdates.attributes;

        if (categoryDefinitions.length > 0 && hasVariantAttributes(normalizedAttrs)) {
            const normResult = normalizeAttributes(normalizedAttrs, categoryDefinitions);
            if (normResult.error) {
                const err = new Error(normResult.error);
                err.statusCode = 400;
                throw err;
            }
            normalizedAttrs = normResult.attributes;
        }

        const otherVariants = await Variant.find({
            productId: product._id,
            _id: { $ne: variant._id },
            isDeleted: false,
        }).session(session || null).lean();

        if (findDuplicateVariant(otherVariants, normalizedAttrs)) {
            const err = new Error('A variant with these attributes already exists');
            err.statusCode = 409;
            throw err;
        }

        variant.attributes = normalizedAttrs;
    }

    if (variantUpdates.price !== undefined) variant.price = roundMoney(variantUpdates.price);
    if (variantUpdates.stock !== undefined) variant.stock = Math.max(0, Math.floor(Number(variantUpdates.stock) || 0));
    if (variantUpdates.compareAtPrice !== undefined) {
        variant.compareAtPrice = variantUpdates.compareAtPrice ? roundMoney(variantUpdates.compareAtPrice) : null;
    }
    if (variantUpdates.sku !== undefined) variant.sku = String(variantUpdates.sku).trim().toUpperCase();
    if (variantUpdates.status !== undefined) {
        variant.status = variantUpdates.status;
        variant.isActive = variantUpdates.status === STATUS.ACTIVE;
    }

    await variant.save(options);
    await recomputeProductSummary(product._id, session);

    const freshProduct = await Product.findById(product._id)
        .populate('storeId', 'name logo address')
        .populate('categoryId', 'title slug icon allowedOptions variantAttributes')
        .session(session || null)
        .lean();

    const allVariants = await Variant.find({ productId: product._id, isDeleted: false })
        .session(session || null)
        .lean();

    return {
        variant,
        product: toProductResponse(freshProduct, allVariants),
    };
}

/**
 * حذف صنف مفرد (Soft Delete Single Variant)
 */
async function deleteSingleVariant({ productId, variantId, storeId, session = null }) {
    const options = session ? { session } : {};
    const product = await Product.findOne({ _id: productId, storeId, isDeleted: false })
        .session(session || null);

    if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
    }

    const variant = await Variant.findOne({ _id: variantId, productId: product._id, isDeleted: false })
        .session(session || null);

    if (!variant) {
        const err = new Error('Variant not found');
        err.statusCode = 404;
        throw err;
    }

    variant.isDeleted = true;
    await variant.save(options);

    await recomputeProductSummary(product._id, session);

    const freshProduct = await Product.findById(product._id)
        .populate('storeId', 'name logo address')
        .populate('categoryId', 'title slug icon allowedOptions variantAttributes')
        .session(session || null)
        .lean();

    const allVariants = await Variant.find({ productId: product._id, isDeleted: false })
        .session(session || null)
        .lean();

    return {
        product: toProductResponse(freshProduct, allVariants),
    };
}

/**
 * تعديل حالة صنف مفرد (Variant Status Toggle)
 */
async function updateVariantStatus({ productId, variantId, storeId, status, session = null }) {
    const options = session ? { session } : {};
    const product = await Product.findOne({ _id: productId, storeId, isDeleted: false })
        .session(session || null);

    if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
    }

    const variant = await Variant.findOne({ _id: variantId, productId: product._id, isDeleted: false })
        .session(session || null);

    if (!variant) {
        const err = new Error('Variant not found');
        err.statusCode = 404;
        throw err;
    }

    variant.status = status;
    variant.isActive = status === STATUS.ACTIVE;
    await variant.save(options);

    await recomputeProductSummary(product._id, session);

    const freshProduct = await Product.findById(product._id)
        .populate('storeId', 'name logo address')
        .populate('categoryId', 'title slug icon allowedOptions variantAttributes')
        .session(session || null)
        .lean();

    const allVariants = await Variant.find({ productId: product._id, isDeleted: false })
        .session(session || null)
        .lean();

    return {
        product: toProductResponse(freshProduct, allVariants),
    };
}

/**
 * تعديل اعتماد صنف من قبل الإدارة (Admin Variant Approval)
 */
async function updateVariantApproval({ productId, variantId, approveStatus, session = null }) {
    const options = session ? { session } : {};
    const product = await Product.findOne({ _id: productId, isDeleted: false }).session(session || null);
    if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
    }

    const variant = await Variant.findOne({ _id: variantId, productId: product._id, isDeleted: false })
        .session(session || null);

    if (!variant) {
        const err = new Error('Variant not found');
        err.statusCode = 404;
        throw err;
    }

    variant.approveStatus = approveStatus;
    await variant.save(options);

    await recomputeProductSummary(product._id, session);

    const freshProduct = await Product.findById(product._id)
        .populate('storeId', 'name logo address')
        .populate('categoryId', 'title slug icon allowedOptions variantAttributes')
        .session(session || null)
        .lean();

    const allVariants = await Variant.find({ productId: product._id, isDeleted: false })
        .session(session || null)
        .lean();

    return {
        product: toProductResponse(freshProduct, allVariants),
    };
}

/**
 * تعديل اعتماد المنتج بالكامل من قبل الإدارة (Admin Product Approval)
 */
async function updateProductApproval({ productId, approveStatus, session = null }) {
    const options = session ? { session } : {};
    const product = await Product.findOne({ _id: productId, isDeleted: false }).session(session || null);
    if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
    }

    product.approveStatus = approveStatus;
    await product.save(options);

    await recomputeProductSummary(product._id, session);

    const freshProduct = await Product.findById(product._id)
        .populate('storeId', 'name logo address')
        .populate('categoryId', 'title slug icon allowedOptions variantAttributes')
        .session(session || null)
        .lean();

    const allVariants = await Variant.find({ productId: product._id, isDeleted: false })
        .session(session || null)
        .lean();

    return {
        product: toProductResponse(freshProduct, allVariants),
    };
}

/**
 * جلب تفاصيل منتج محدد مع أصنافه
 */
async function getProductDetails(req, res, next, admin = false) {
    try {
        const filter = { _id: req.params.id, isDeleted: false };
        const candidate = await Product.findOne(filter).select('storeId').lean();
        if (!candidate) {
            return error(res, 404, 'Product not found');
        }

        const isOwnerSeller = Boolean(
            req.store &&
            req.user &&
            req.user.role === ROLE.SELLER &&
            String(candidate.storeId) === String(req.store._id)
        );

        if (!admin && !isOwnerSeller) {
            filter.status = STATUS.ACTIVE;
            filter.approveStatus = APPROVE_STATUS.APPROVED;
            filter.isSuspended = false;
        }

        const product = await Product.findOne(filter)
            .populate('storeId', 'name logo address')
            .populate('categoryId', 'title slug icon allowedOptions variantAttributes')
            .lean();

        if (!product || !product.storeId || !product.categoryId) {
            return error(res, 404, 'Product not found');
        }

        const variantFilter = { productId: product._id, isDeleted: false };
        if (!admin && !isOwnerSeller) {
            variantFilter.status = STATUS.ACTIVE;
            variantFilter.approveStatus = APPROVE_STATUS.APPROVED;
            variantFilter.isSuspended = { $ne: true };
        }

        const variants = await Variant.find(variantFilter).lean();
        return success(res, 200, { product: toProductResponse(product, variants) });
    } catch (err) {
        return next(err);
    }
}

/**
 * جلب قائمة المنتجات مع دعم الفلترة والترقيم
 */
async function listProducts(req, res, next, admin = false, sellerStoreId = null) {
    try {
        const {
            page = 1,
            limit = 20,
            sort = 'newest',
        } = req.query;

        const pageNumber = Math.max(1, Number(page) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));

        const productFilter = createProductFilter(req.query, admin, sellerStoreId);

        const sortOptions = {};
        if (sort === 'price_asc' || sort === 'price-asc') {
            sortOptions.minPrice = 1;
        } else if (sort === 'price_desc' || sort === 'price-desc') {
            sortOptions.maxPrice = -1;
        } else {
            sortOptions.createdAt = -1;
        }
        sortOptions._id = -1;

        const [total, products] = await Promise.all([
            Product.countDocuments(productFilter),
            Product.find(productFilter)
                .sort(sortOptions)
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize)
                .populate('storeId', 'name logo address')
                .populate('categoryId', 'title slug icon allowedOptions variantAttributes')
                .lean(),
        ]);

        const pageProductIds = products.map((p) => p._id);
        const variantFilter = {
            productId: { $in: pageProductIds },
            isDeleted: false,
        };

        if (!admin && !sellerStoreId) {
            variantFilter.status = STATUS.ACTIVE;
            variantFilter.approveStatus = APPROVE_STATUS.APPROVED;
            variantFilter.isSuspended = { $ne: true };
        }

        const variants = await Variant.find(variantFilter).lean();

        const variantsMap = new Map();
        variants.forEach((v) => {
            const key = String(v.productId);
            if (!variantsMap.has(key)) variantsMap.set(key, []);
            variantsMap.get(key).push(v);
        });

        const orderedProducts = products.map((p) =>
            toProductResponse(p, variantsMap.get(String(p._id)) || [])
        );

        return success(res, 200, {
            products: orderedProducts,
            count: orderedProducts.length,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                pages: Math.ceil(total / pageSize) || 1,
            },
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * إضافة خيار جديد لمنتج قائم وتطبيقه بشكل Idempotent على كافة الأصناف الحالية بقيمة افتراضية
 */
async function applyOptionAdditionIdempotent({ productId, newOption, defaultValue, session = null }) {
    const options = session ? { session } : {};
    const product = await Product.findById(productId).session(session || null);
    if (!product) {
        throw new Error('المنتج غير موجود');
    }

    const optKey = String(newOption.key).toLowerCase().trim();
    const existingOptIndex = product.options.findIndex((o) => o.key === optKey);

    if (existingOptIndex >= 0) {
        if (!product.options[existingOptIndex].values.includes(defaultValue)) {
            product.options[existingOptIndex].values.push(defaultValue);
        }
    } else {
        product.options.push({
            key: optKey,
            source: newOption.source || 'DEFINED',
            label: newOption.label || optKey,
            type: newOption.type || 'TEXT',
            unit: newOption.unit || null,
            values: [defaultValue],
        });
    }

    await product.save(options);

    const existingVariants = await Variant.find({ productId: product._id, isDeleted: false }).session(session || null);

    for (const v of existingVariants) {
        const currentAttrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {});
        if (!currentAttrs[optKey]) {
            currentAttrs[optKey] = defaultValue;
            v.attributes = currentAttrs;
            await v.save(options);
        }
    }

    await recomputeProductSummary(product._id, session);
    return product;
}

module.exports = {
    MAX_VARIANTS_PER_PRODUCT,
    createProductDocuments,
    updateProductDocuments,
    addSingleVariant,
    updateSingleVariant,
    deleteSingleVariant,
    updateVariantStatus,
    updateVariantApproval,
    updateProductApproval,
    getProductDetails,
    listProducts,
    prepareVariantPayload,
    applyOptionAdditionIdempotent,
};