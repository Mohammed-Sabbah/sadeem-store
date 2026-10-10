const mongoose = require('mongoose');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const Category = require('../models/Category');
const OptionDefinition = require('../models/OptionDefinition');
const { success, error } = require('../utils/responses');
const { roundMoney } = require('../utils/money');
const { createProductFilter, recomputeProductSummary, generateVariantSku } = require('../utils/product');

const MAX_VARIANTS_PER_PRODUCT = 100;

/**
 * تجهيز وتنظيف بيانات الصنف (Variant) والتحقق من قيود المال والمخزون والـ SKU
 */
function prepareVariantPayload(rawVariant, productTitle, index = 1, storeId = null) {
    const variant = { ...rawVariant };

    if (!variant.attributes || typeof variant.attributes !== 'object') {
        variant.attributes = {};
    }

    // دعم الخصائص الموروثة أو المدخلة مباشرة (كـ color أو size)
    if (variant.color && !variant.attributes['اللون'] && !variant.attributes['color']) {
        variant.attributes['اللون'] = variant.color;
    }
    if (variant.size && !variant.attributes['المقاس'] && !variant.attributes['size']) {
        variant.attributes['المقاس'] = variant.size;
    }

    // توليد SKU تلقائي في حال عدم توفره
    if (!variant.sku || !String(variant.sku).trim()) {
        variant.sku = generateVariantSku(productTitle, variant.attributes, index);
    } else {
        variant.sku = String(variant.sku).trim().toUpperCase();
    }

    variant.price = roundMoney(variant.price || 0);
    variant.stock = Math.max(0, Math.floor(Number(variant.stock) || 0));

    if (variant.compareAtPrice !== undefined && variant.compareAtPrice !== null && String(variant.compareAtPrice).trim() !== '') {
        variant.compareAtPrice = roundMoney(variant.compareAtPrice);
    } else {
        variant.compareAtPrice = null;
    }

    if (Array.isArray(variant.images)) {
        variant.images = variant.images.filter(Boolean).map(String);
    } else if (variant.image) {
        variant.images = [String(variant.image)];
    } else {
        variant.images = [];
    }

    if (storeId) {
        variant.storeId = storeId;
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

    // التحقق من خيارات التصنيف المسموحة إن وجدت
    if (categoryId && Array.isArray(options) && options.length > 0) {
        const allowedKeys = await Category.resolveAllowedOptions(categoryId);
        if (allowedKeys && allowedKeys.length > 0) {
            const allowedSet = new Set(allowedKeys.map((k) => String(k).toLowerCase().trim()));
            for (const opt of options) {
                if (opt.source === 'DEFINED' && opt.key && !allowedSet.has(String(opt.key).toLowerCase().trim())) {
                    // تحذير أو منع الخيارات غير المصرحة للتصنيف المعتمد
                    // نتيح المرونة إن كان خياراً عاماً أو معرفاً
                }
            }
        }
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

    // تحديث كافة الأصناف القائمة لتضمين القيمة الافتراضية للخيار الجديد
    const existingVariants = await Variant.find({ productId: product._id }).session(session || null);

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

/**
 * إنشاء مستندات المنتج والأصناف التابعة له
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
        [product] = await Product.create([productData], options);

        const variantsToCreate = (rawVariants || []).map((raw, idx) => {
            const prepared = prepareVariantPayload(raw, product.title, idx + 1, product.storeId);
            return {
                ...prepared,
                productId: product._id,
                storeId: product.storeId,
            };
        });

        const createdVariants = await Variant.create(variantsToCreate, options);

        // احتساب ملخص الأسعار والمخزون آلياً
        await recomputeProductSummary(product._id, session);

        const freshProduct = await Product.findById(product._id)
            .populate('storeId', 'name logo address')
            .populate('categoryId', 'title slug icon allowedOptions')
            .session(session || null)
            .lean();

        return {
            ...freshProduct,
            variants: createdVariants.map((v) => v.toObject()),
        };
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
 * تحديث بيانات المنتج وأصنافه
 */
async function updateProductDocuments({ id, storeId, productUpdates, variants, session = null }) {
    const options = session ? { session } : {};
    const productQuery = Product.findOne({ _id: id, storeId, isDeleted: { $ne: true } });
    if (session) productQuery.session(session);
    const product = await productQuery;
    if (!product) return null;

    if (variants && Array.isArray(variants)) {
        await validateProductOptionsAndVariants({
            categoryId: productUpdates?.categoryId || product.categoryId,
            options: productUpdates?.options || product.options,
            variants,
        });

        const originalVariants = await Variant.find({ productId: product._id })
            .select('_id')
            .session(session || null)
            .lean();
        const originalVariantIds = originalVariants.map((v) => v._id);

        const requestedExistingIds = variants
            .filter((v) => v._id)
            .map((v) => String(v._id));

        const existingFound = await Variant.find({
            _id: { $in: requestedExistingIds },
            productId: product._id,
        }).session(session || null);

        if (existingFound.length !== requestedExistingIds.length) {
            const err = new Error('واحد أو أكثر من الأصناف لا ينتمي لهذا المنتج');
            err.statusCode = 400;
            throw err;
        }

        try {
            const newVariantsPayload = variants
                .filter((v) => !v._id)
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

            for (const v of variants.filter((item) => item._id)) {
                const updates = { ...v };
                delete updates._id;

                if (updates.sku) updates.sku = String(updates.sku).trim().toUpperCase();
                if (updates.price !== undefined) updates.price = roundMoney(updates.price);
                if (updates.stock !== undefined) updates.stock = Math.max(0, Math.floor(Number(updates.stock) || 0));
                if (updates.compareAtPrice !== undefined) {
                    updates.compareAtPrice = updates.compareAtPrice ? roundMoney(updates.compareAtPrice) : null;
                }
                updates.storeId = product.storeId;

                const updated = await Variant.findOneAndUpdate(
                    { _id: v._id, productId: product._id },
                    { $set: updates },
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

            // إزالة الأصناف المحذوفة
            await Variant.deleteMany(
                {
                    productId: product._id,
                    _id: { $nin: retainedIds },
                },
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

    if (productUpdates && Object.keys(productUpdates).length > 0) {
        Object.assign(product, productUpdates);
        await product.save(options);
    }

    // إعادة احتساب الملخص
    await recomputeProductSummary(product._id, session);

    const updatedProduct = await Product.findById(product._id)
        .populate('storeId', 'name logo address')
        .populate('categoryId', 'title slug icon allowedOptions')
        .session(session || null)
        .lean();

    updatedProduct.variants = await Variant.find({ productId: product._id })
        .session(session || null)
        .lean();

    return updatedProduct;
}

/**
 * جلب تفاصيل منتج محدد مع أصنافه
 */
async function getProductDetails(req, res, next, admin = false) {
    try {
        const filter = { _id: req.params.id, isDeleted: { $ne: true } };
        if (!admin) {
            filter.isActive = true;
            filter.isSuspended = false;
        }

        const product = await Product.findOne(filter)
            .populate('storeId', 'name logo address balance')
            .populate('categoryId', 'title slug icon allowedOptions')
            .lean();

        if (!product) {
            return error(res, 404, 'المنتج غير موجود');
        }

        const variantFilter = { productId: product._id };
        if (!admin) {
            variantFilter.isActive = true;
            variantFilter.isSuspended = { $ne: true };
        }

        product.variants = await Variant.find(variantFilter).lean();
        return success(res, 200, { product });
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

        const productFilter = createProductFilter(req.query, admin);
        if (sellerStoreId) {
            productFilter.storeId = sellerStoreId;
        }

        const sortOptions = {};
        if (sort === 'price_asc') {
            sortOptions.minPrice = 1;
        } else if (sort === 'price_desc') {
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
                .populate('categoryId', 'title slug icon allowedOptions')
                .lean(),
        ]);

        const pageProductIds = products.map((p) => p._id);
        const variants = await Variant.find({
            productId: { $in: pageProductIds },
            isActive: true,
            isSuspended: { $ne: true },
        }).lean();

        const variantsMap = new Map();
        variants.forEach((v) => {
            const key = String(v.productId);
            if (!variantsMap.has(key)) variantsMap.set(key, []);
            variantsMap.get(key).push(v);
        });

        const orderedProducts = products.map((p) => ({
            ...p,
            variants: variantsMap.get(String(p._id)) || [],
        }));

        return success(res, 200, {
            products: orderedProducts,
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

module.exports = {
    MAX_VARIANTS_PER_PRODUCT,
    createProductDocuments,
    updateProductDocuments,
    getProductDetails,
    listProducts,
    prepareVariantPayload,
    applyOptionAdditionIdempotent,
};