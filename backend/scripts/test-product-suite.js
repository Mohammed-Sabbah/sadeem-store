const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Store = require('../models/Store');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const OptionDefinition = require('../models/OptionDefinition');
const {
    createProductDocuments,
    updateProductDocuments,
    listProducts,
    getProductDetails,
    applyOptionAdditionIdempotent,
    MAX_VARIANTS_PER_PRODUCT,
} = require('../services/product.service');
const { recomputeProductSummary } = require('../utils/product');
const { roundMoney, isMoney } = require('../utils/money');
const { ROLE, STATUS, STORE_APPROVE_STATUS } = require('../constants/enums');

async function runProductSuite() {
    console.log('\n================================================================');
    console.log('   سَدِيم (Sadeem) — فحص شامل وهندسي لمنظومة المنتجات والخيارات   ');
    console.log('================================================================\n');

    await connectDB();
    await Variant.syncIndexes();
    await Product.syncIndexes();
    console.log('✔ اتصال سليم ومزامنة فهارس MongoDB بنجاح');

    // Setup Parent & Sub Categories
    const topCategory = await Category.findOneAndUpdate(
        { slug: 'fashion-top-test' },
        {
            title: 'أزياء وملابس فاخرة',
            slug: 'fashion-top-test',
            allowedOptions: ['color', 'size_clothing'],
        },
        { upsert: true, new: true }
    );

    const subCategory = await Category.findOneAndUpdate(
        { slug: 'dresses-sub-test' },
        {
            title: 'فساتين سهرة',
            slug: 'dresses-sub-test',
            topCategoryId: topCategory._id,
            allowedOptions: [], // Should inherit from topCategory
        },
        { upsert: true, new: true }
    );

    // Setup 2 Stores to test Store-Scoped SKU Uniqueness
    const testUser1 = await User.create({
        name: 'تاجر الأزياء 1',
        phoneNumber: `0599${Date.now().toString().slice(-6)}1`,
        email: `seller1_${Date.now()}@sadeem.ps`,
        password: 'hashed_password_test',
        role: ROLE.SELLER,
        status: STATUS.ACTIVE,
    });

    const testStore1 = await Store.create({
        ownerId: testUser1._id,
        categoryId: subCategory._id,
        name: 'دار الحرير والنور',
        address: {
            governorate: 'central',
            city: 'deir_albalah',
            detailedAddress: 'شارع النخيل، دير البلح',
            coordinates: { lat: 31.4185, lng: 34.3514 },
        },
        status: STATUS.ACTIVE,
        approveStatus: STORE_APPROVE_STATUS.APPROVED,
    });

    const testUser2 = await User.create({
        name: 'تاجر الأزياء 2',
        phoneNumber: `0599${Date.now().toString().slice(-6)}2`,
        email: `seller2_${Date.now()}@sadeem.ps`,
        password: 'hashed_password_test',
        role: ROLE.SELLER,
        status: STATUS.ACTIVE,
    });

    const testStore2 = await Store.create({
        ownerId: testUser2._id,
        categoryId: subCategory._id,
        name: 'متجر سماء كوزميك',
        address: {
            governorate: 'central',
            city: 'nuseirat',
            detailedAddress: 'السوق المركزي، النصيرات',
            coordinates: { lat: 31.4485, lng: 34.3914 },
        },
        status: STATUS.ACTIVE,
        approveStatus: STORE_APPROVE_STATUS.APPROVED,
    });

    console.log('✔ تجهيز بيانات المتجرين والتصنيفات في المحافظة الوسطى بنجاح');

    // ----------------------------------------------------------------
    // TEST 1: توريث الخيارات المسموحة من التصنيف الأب (Category Inheritance)
    // ----------------------------------------------------------------
    const inheritedOptions = await Category.resolveAllowedOptions(subCategory._id);
    if (
        Array.isArray(inheritedOptions) &&
        inheritedOptions.includes('color') &&
        inheritedOptions.includes('size_clothing')
    ) {
        console.log('✔ [PASS] توريث الخيارات المسموحة من التصنيف الرئيسي بنجاح:', inheritedOptions.join(', '));
    } else {
        throw new Error(`فشل توريث الخيارات! القيمة: ${JSON.stringify(inheritedOptions)}`);
    }

    // ----------------------------------------------------------------
    // TEST 2: إنشاء منتج بأصناف متعددة وأسعار مالية مضبوطة
    // ----------------------------------------------------------------
    const productData = {
        storeId: testStore1._id,
        categoryId: subCategory._id,
        title: 'فستان السديم الحريري الأسود',
        description: 'حرير ألباستر فاخر مع خياطة يدوية متقنة',
        images: ['https://images.unsplash.com/photo-dress.jpg'],
        options: [
            { key: 'color', source: 'DEFINED', label: 'اللون', type: 'COLOR', values: ['black', 'amber'] },
            { key: 'size_clothing', source: 'DEFINED', label: 'المقاس', type: 'SIZE', values: ['s', 'm'] },
        ],
    };

    const sharedSku = `SDM-DRS-BLK-S-1001`;

    const variantsData = [
        {
            sku: sharedSku,
            attributes: { color: 'black', size_clothing: 's' },
            price: 180.5,
            stock: 10,
        },
        {
            sku: `SDM-DRS-BLK-M-1002`,
            attributes: { color: 'black', size_clothing: 'm' },
            price: 195.0,
            stock: 6,
        },
        {
            sku: `SDM-DRS-AMB-S-1003`,
            attributes: { color: 'amber', size_clothing: 's' },
            price: 210.0,
            stock: 4,
        },
    ];

    const createdProduct = await createProductDocuments(productData, variantsData);
    if (!createdProduct || !createdProduct._id) {
        throw new Error('فشل إنشاء المنتج في قاعدة البيانات!');
    }
    console.log('✔ [PASS] إنشاء المنتج والـ Variants بنجاح:', createdProduct.title);

    // ----------------------------------------------------------------
    // TEST 3: التحقق من احتساب ملخص المنتج (Product Summary) وتقريب المال
    // ----------------------------------------------------------------
    const savedProduct = await Product.findById(createdProduct._id).lean();
    if (
        savedProduct.minPrice === 180.5 &&
        savedProduct.maxPrice === 210 &&
        savedProduct.totalStock === 20 &&
        savedProduct.inStock === true
    ) {
        console.log(
            `✔ [PASS] احتساب ملخص المنتج آلياً بدقة: أقل سعر=${savedProduct.minPrice} ₪، أعلى سعر=${savedProduct.maxPrice} ₪، إجمالي المخزون=${savedProduct.totalStock} ق`
        );
    } else {
        throw new Error(`خطأ في ملخص الأسعار! النتائج: ${JSON.stringify(savedProduct)}`);
    }

    // ----------------------------------------------------------------
    // TEST 4: منع تكرار الـ Variant لنفس المنتج (Compound Unique attrKey)
    // ----------------------------------------------------------------
    let duplicateAttrRejected = false;
    try {
        await Variant.create({
            productId: createdProduct._id,
            storeId: testStore1._id,
            sku: `SDM-DIFF-SKU-${Date.now()}`,
            attributes: { color: 'black', size_clothing: 's' }, // duplicate combo
            price: 180.5,
            stock: 5,
        });
    } catch (err) {
        if (err.code === 11000 && err.message.includes('attrKey')) {
            duplicateAttrRejected = true;
        }
    }
    if (duplicateAttrRejected) {
        console.log('✔ [PASS] منع تكرار تركيبة الخصائص (color:black + size:s) بنجاح عبر الفهرس المركب');
    } else {
        throw new Error('فشل منع تكرار تركيبة الخصائص لنفس المنتج!');
    }

    // ----------------------------------------------------------------
    // TEST 5: نطاق الـ SKU على مستوى المتجر (Store-Scoped SKU)
    // متجر 1 لا يمكنه تكرار نفس الـ SKU، ولكن متجر 2 يمكنه استخدامه بحرية!
    // ----------------------------------------------------------------
    let sameStoreSkuRejected = false;
    try {
        await Variant.create({
            productId: createdProduct._id,
            storeId: testStore1._id,
            sku: sharedSku, // duplicate inside Store 1
            attributes: { color: 'amber', size_clothing: 'm' },
            price: 220,
            stock: 3,
        });
    } catch (err) {
        if (err.code === 11000 && err.message.includes('sku')) {
            sameStoreSkuRejected = true;
        }
    }
    if (sameStoreSkuRejected) {
        console.log('✔ [PASS] رفض تكرار كود الـ SKU داخل نفس المتجر بنجاح');
    } else {
        throw new Error('فشل منع تكرار SKU داخل نفس المتجر!');
    }

    // الآن: متجر 2 يُنشئ منتجاً بنفس كود الـ SKU sharedSku دون أي خطأ
    const store2Product = await Product.create({
        storeId: testStore2._id,
        categoryId: subCategory._id,
        title: 'فستان متجر سماء',
    });

    const store2Variant = await Variant.create({
        productId: store2Product._id,
        storeId: testStore2._id,
        sku: sharedSku, // نفس الـ SKU لكن في متجر آخر
        attributes: { color: 'black' },
        price: 180,
        stock: 8,
    });

    if (store2Variant && String(store2Variant.sku) === sharedSku) {
        console.log('✔ [PASS] السماح لمتجر آخر (Store 2) باستخدام نفس الـ SKU المورد بنجاح تام (Store-Scoped SKU)');
    } else {
        throw new Error('فشل دعم الـ SKU على مستوى المتجر!');
    }

    // ----------------------------------------------------------------
    // TEST 6: فحص قيود العملة (Money Validation) والمخزون الصحيح (Integer Stock)
    // ----------------------------------------------------------------
    let invalidMoneyRejected = false;
    try {
        await Variant.create({
            productId: createdProduct._id,
            storeId: testStore1._id,
            sku: `SDM-TEST-MONEY-${Date.now()}`,
            attributes: { color: 'white' },
            price: 75.999, // 3 decimal places -> invalid!
            stock: 5,
        });
    } catch (err) {
        invalidMoneyRejected = true;
    }
    if (invalidMoneyRejected) {
        console.log('✔ [PASS] رفض الأسعار التي تزيد عن منزلتين عشريتين (Money Validation) بنجاح');
    } else {
        throw new Error('فشل التحقق من قيود المال (3 منازل عشرية)!');
    }

    let floatStockRejected = false;
    try {
        await Variant.create({
            productId: createdProduct._id,
            storeId: testStore1._id,
            sku: `SDM-TEST-STOCK-${Date.now()}`,
            attributes: { color: 'white' },
            price: 75,
            stock: 5.5, // Float stock -> invalid!
        });
    } catch (err) {
        floatStockRejected = true;
    }
    if (floatStockRejected) {
        console.log('✔ [PASS] رفض المخزون بالكسور (Integer Stock Validation) بنجاح');
    } else {
        throw new Error('فشل التحقق من كسرية المخزون!');
    }

    // ----------------------------------------------------------------
    // TEST 7: فحص الحد الأقصى للأصناف (Max 100 Variants Limit)
    // ----------------------------------------------------------------
    let maxVariantsExceeded = false;
    try {
        const dummyVariants = Array.from({ length: 101 }, (_, i) => ({
            sku: `SDM-OVER-${i}`,
            attributes: { item: `val_${i}` },
            price: 10,
            stock: 1,
        }));
        await createProductDocuments(
            {
                storeId: testStore1._id,
                categoryId: subCategory._id,
                title: 'منتج يتجاوز 100 صنف',
            },
            dummyVariants
        );
    } catch (err) {
        if (err.message && err.message.includes('100 صنف')) {
            maxVariantsExceeded = true;
        }
    }
    if (maxVariantsExceeded) {
        console.log('✔ [PASS] حظر تجاوز الحد الأقصى للأصناف (100 صنف) بنجاح قاطع');
    } else {
        throw new Error('فشل فحص الحد الأقصى للأصناف!');
    }

    // ----------------------------------------------------------------
    // TEST 8: إضافة خيار جديد لمنتج قائم بشكل Idempotent مع قيمة افتراضية
    // ----------------------------------------------------------------
    await applyOptionAdditionIdempotent({
        productId: createdProduct._id,
        newOption: { key: 'material', label: 'الخامة', source: 'CUSTOM', type: 'TEXT' },
        defaultValue: 'حرير طبيعي',
    });

    const updatedVariants = await Variant.find({ productId: createdProduct._id }).lean();
    const allHaveMaterial = updatedVariants.every((v) => {
        const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {});
        return attrs.material === 'حرير طبيعي' && v.attrKey.includes('material:حرير طبيعي');
    });

    if (allHaveMaterial) {
        console.log('✔ [PASS] إضافة خيار جديد بشكل Idempotent لكافة الأصناف القائمة مع احتساب حتمي للـ attrKey');
    } else {
        throw new Error('فشل الإضافة الـ Idempotent للخيار الجديد!');
    }

    // ----------------------------------------------------------------
    // TEST 9: الخصم الذري للمخزون (Atomic Stock Decrement) وتحديث الملخص
    // ----------------------------------------------------------------
    const targetVariant = await Variant.findOne({ productId: createdProduct._id, sku: sharedSku });
    const decResult = await Variant.findOneAndUpdate(
        { _id: targetVariant._id, stock: { $gte: 2 } },
        { $inc: { stock: -2 } },
        { new: true }
    );

    if (decResult.stock === 8) {
        await recomputeProductSummary(createdProduct._id);
        const recomputed = await Product.findById(createdProduct._id).lean();
        if (recomputed.totalStock === 18) {
            console.log('✔ [PASS] الخصم الذري للمخزون (Atomic Stock Decrement) واحتساب الملخص الفوري بنجاح 100%');
        } else {
            throw new Error('فشل احتساب ملخص المخزون بعد الخصم!');
        }
    } else {
        throw new Error('فشل خصم المخزون الذري!');
    }

    // ----------------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------------
    await Variant.deleteMany({ productId: { $in: [createdProduct._id, store2Product._id] } });
    await Product.deleteMany({ _id: { $in: [createdProduct._id, store2Product._id] } });
    await Store.deleteMany({ _id: { $in: [testStore1._id, testStore2._id] } });
    await User.deleteMany({ _id: { $in: [testUser1._id, testUser2._id] } });
    await Category.deleteMany({ _id: { $in: [topCategory._id, subCategory._id] } });

    console.log('\n✨ جميع الاختبارات الهندسية الشاملة اجتازت بنجاح 100% دون أي خطأ!\n');
    await mongoose.disconnect();
}

runProductSuite().catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
});
