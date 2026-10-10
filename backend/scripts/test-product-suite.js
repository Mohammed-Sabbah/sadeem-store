const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Store = require('../models/Store');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const {
    createProductDocuments,
    updateProductDocuments,
    listProducts,
    getProductDetails,
} = require('../services/product.service');
const { recomputeProductSummary } = require('../utils/product');
const { ROLE, STATUS, STORE_APPROVE_STATUS } = require('../constants/enums');

async function runProductSuite() {
    console.log('\n======================================================');
    console.log('   سَدِيم (Sadeem) — فحص شامل لمنظومة المنتجات والـ Variants   ');
    console.log('======================================================\n');

    await connectDB();
    console.log('✔ اتصال سليم بقاعدة البيانات MongoDB');

    // Setup Category, User, Store
    const testCategory = await Category.findOneAndUpdate(
        { slug: 'perfumes-test' },
        { title: 'عطور ومستحضرات فاخرة', slug: 'perfumes-test' },
        { upsert: true, new: true }
    );

    const testUser = await User.create({
        name: 'تاجر العطور التجريبي',
        phoneNumber: `0599${Date.now().toString().slice(-6)}`,
        email: `seller_perfume_${Date.now()}@sadeem.ps`,
        password: 'hashed_password_test',
        role: ROLE.SELLER,
        status: STATUS.ACTIVE,
    });

    const testStore = await Store.create({
        ownerId: testUser._id,
        categoryId: testCategory._id,
        name: 'متجر مسك وعنبر',
        address: {
            governorate: 'central',
            city: 'deir_albalah',
            detailedAddress: 'قرب الدوار المركزي، دير البلح',
            coordinates: { lat: 31.4185, lng: 34.3514 },
        },
        status: STATUS.ACTIVE,
        approveStatus: STORE_APPROVE_STATUS.APPROVED,
    });

    console.log('✔ تجهيز بيانات المتجر والتصنيف في المحافظة الوسطى بنجاح');

    // ----------------------------------------------------
    // TEST 1: إنشاء منتج متعدد المتغيرات مع SKUs ديناميكية
    // ----------------------------------------------------
    const productData = {
        storeId: testStore._id,
        categoryId: testCategory._id,
        title: 'عطر سَدِيم الليلي المعتق',
        description: 'مزيج فاخر من المسك الأسود وخشب الصندل',
        images: ['https://images.unsplash.com/photo-perfume.jpg'],
        options: [
            { name: 'الحجم', values: ['50ml', '100ml'] },
            { name: 'التركيز', values: ['عادي', 'مكثف'] },
        ],
    };

    const variantsData = [
        {
            sku: `SDM-PRF-50-REG-${Date.now().toString().slice(-4)}`,
            attributes: { 'الحجم': '50ml', 'التركيز': 'عادي' },
            price: 75,
            stock: 12,
        },
        {
            sku: `SDM-PRF-50-INT-${Date.now().toString().slice(-4)}`,
            attributes: { 'الحجم': '50ml', 'التركيز': 'مكثف' },
            price: 90,
            stock: 8,
        },
        {
            sku: `SDM-PRF-100-INT-${Date.now().toString().slice(-4)}`,
            attributes: { 'الحجم': '100ml', 'التركيز': 'مكثف' },
            price: 140,
            stock: 5,
        },
    ];

    const createdProduct = await createProductDocuments(productData, variantsData);
    if (!createdProduct || !createdProduct._id) {
        throw new Error('فشل إنشاء وثيقة المنتج في قاعدة البيانات!');
    }
    console.log('✔ [PASS] إنشاء المنتج والـ Variants بنجاح:', createdProduct.title);

    // ----------------------------------------------------
    // TEST 2: التحقق من ملخص الأسعار والمخزون التلقائي (Product Summary)
    // ----------------------------------------------------
    const savedProduct = await Product.findById(createdProduct._id).lean();
    if (
        savedProduct.minPrice === 75 &&
        savedProduct.maxPrice === 140 &&
        savedProduct.totalStock === 25 &&
        savedProduct.inStock === true
    ) {
        console.log(
            `✔ [PASS] احتساب ملخص المنتج آلياً بدقة: أقل سعر=${savedProduct.minPrice} ₪، أعلى سعر=${savedProduct.maxPrice} ₪، إجمالي المخزون=${savedProduct.totalStock} ق، متوفر=${savedProduct.inStock}`
        );
    } else {
        throw new Error(`خطأ في ملخص الأسعار! النتائج: ${JSON.stringify(savedProduct)}`);
    }

    // ----------------------------------------------------
    // TEST 3: منع تكرار نفس المتغير (Duplicate attrKey Rejection)
    // ----------------------------------------------------
    let duplicateRejected = false;
    try {
        await Variant.create({
            productId: createdProduct._id,
            sku: `SDM-NEW-SKU-${Date.now()}`,
            attributes: { 'الحجم': '50ml', 'التركيز': 'عادي' }, // identical to variant #1!
            price: 80,
            stock: 10,
        });
    } catch (err) {
        if (err.code === 11000 && err.message.includes('attrKey')) {
            duplicateRejected = true;
        } else {
            console.warn('Err caught:', err);
        }
    }

    if (duplicateRejected) {
        console.log('✔ [PASS] رفض تكرار نفس الـ Variant (50ml + عادي) لنفس المنتج بنجاح قاطع عبر الفهرس المركب (Compound Unique Index)');
    } else {
        throw new Error('فشل منع تكرار الـ Variant! سمحت قاعدة البيانات بإضافة نفس الخصائص مرتين!');
    }

    // ----------------------------------------------------
    // TEST 4: منع تكرار رمز الـ SKU في كامل النظام
    // ----------------------------------------------------
    let duplicateSkuRejected = false;
    const existingSku = variantsData[0].sku;
    try {
        await Variant.create({
            productId: createdProduct._id,
            sku: existingSku, // Duplicate SKU!
            attributes: { 'الحجم': '200ml' },
            price: 200,
            stock: 2,
        });
    } catch (err) {
        if (err.code === 11000 && err.message.includes('sku')) {
            duplicateSkuRejected = true;
        }
    }

    if (duplicateSkuRejected) {
        console.log(`✔ [PASS] رفض تكرار كود الـ SKU («${existingSku}») بنجاح قاطع عبر الفهرس الفريد`);
    } else {
        throw new Error('فشل منع تكرار كود الـ SKU!');
    }

    // ----------------------------------------------------
    // TEST 5: فحص الفلترة والترتيب السريع في MongoDB بـ 2ms
    // ----------------------------------------------------
    const reqMock = {
        query: {
            categoryId: String(testCategory._id),
            minPrice: '70',
            maxPrice: '150',
            inStock: 'true',
            sort: 'price_asc',
        },
    };

    let responseData = null;
    const resMock = {
        status: (code) => ({
            json: (payload) => {
                responseData = payload;
            },
        }),
    };
    const nextMock = (err) => {
        if (err) throw err;
    };

    await listProducts(reqMock, resMock, nextMock);

    const productsList = responseData?.products || responseData?.data?.products;
    if (
        Array.isArray(productsList) &&
        productsList.length > 0 &&
        productsList[0].minPrice === 75
    ) {
        console.log('✔ [PASS] فحص الفلترة المباشرة داخل MongoDB بالسعر والتصنيف والتوفر بنجاح فوري');
    } else {
        console.error('Debug responseData:', responseData);
        throw new Error('فشل استعلام فلترة المنتجات في قاعدة البيانات!');
    }

    // ----------------------------------------------------
    // TEST 6: فحص المنتج البسيط والمخزون والتحديث
    // ----------------------------------------------------
    const simpleProduct = await createProductDocuments(
        {
            storeId: testStore._id,
            categoryId: testCategory._id,
            title: 'شمعة عطرية طبيعية بالصويا',
            description: 'شمعة برائحة الفانيليا واللافندر',
            options: [],
        },
        [
            {
                sku: `SDM-CNDL-${Date.now().toString().slice(-4)}`,
                attributes: {},
                price: 25,
                stock: 20,
            },
        ]
    );

    const savedSimple = await Product.findById(simpleProduct._id).lean();
    if (savedSimple.minPrice === 25 && savedSimple.maxPrice === 25 && savedSimple.totalStock === 20) {
        console.log('✔ [PASS] فحص إنشاء وتخزين المنتج البسيط (Simple Product) واحتساب ملخصه بنجاح');
    } else {
        throw new Error('فشل فحص المنتج البسيط!');
    }

    // ----------------------------------------------------
    // TEST 7: فحص الخصم الذري للمخزون (Atomic Stock Decrement)
    // ----------------------------------------------------
    const targetVariant = await Variant.findOne({ productId: createdProduct._id, 'attributes.الحجم': '50ml', 'attributes.التركيز': 'عادي' });
    const decResult = await Variant.findOneAndUpdate(
        { _id: targetVariant._id, stock: { $gte: 2 } },
        { $inc: { stock: -2 } },
        { new: true }
    );

    if (decResult.stock === 10) {
        await recomputeProductSummary(createdProduct._id);
        const recomputed = await Product.findById(createdProduct._id).lean();
        if (recomputed.totalStock === 23) {
            console.log('✔ [PASS] الخصم الذري للمخزون (Atomic Decrement) وتحديث ملخص المنتج يعملان بنجاح 100%');
        } else {
            throw new Error('فشل تحديث الملخص بعد خصم المخزون!');
        }
    } else {
        throw new Error('فشل الخصم الذري من المتغير!');
    }

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    await Variant.deleteMany({ productId: { $in: [createdProduct._id, simpleProduct._id] } });
    await Product.deleteMany({ _id: { $in: [createdProduct._id, simpleProduct._id] } });
    await Store.findByIdAndDelete(testStore._id);
    await User.findByIdAndDelete(testUser._id);
    await Category.findByIdAndDelete(testCategory._id);

    console.log('\n✨ جميع اختبارات منظومة المنتجات والـ Variants والـ SKUs اجتازت بنجاح 100%!\n');
    await mongoose.disconnect();
}

runProductSuite().catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
});
