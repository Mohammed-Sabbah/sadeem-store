const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const app = require('../app');
const User = require('../models/User');
const Store = require('../models/Store');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const { issueAccessToken } = require('../utils/token');
const { ROLE, STATUS, APPROVE_STATUS } = require('../constants/enums');

// Simple in-memory HTTP caller using Express app directly
async function mockRequest(method, url, body = null, cookies = {}) {
    return new Promise((resolve, reject) => {
        const http = require('http');
        const server = http.createServer(app);

        server.listen(0, async () => {
            const port = server.address().port;
            try {
                const cookieHeader = Object.entries(cookies)
                    .map(([k, v]) => `${k}=${v}`)
                    .join('; ');

                const headers = {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                };
                if (cookieHeader) headers.Cookie = cookieHeader;

                const options = {
                    method,
                    headers,
                };
                if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
                    options.body = JSON.stringify(body);
                }

                const response = await fetch(`http://127.0.0.1:${port}${url}`, options);
                const json = await response.json().catch(() => null);

                server.close();
                resolve({
                    status: response.status,
                    ok: response.ok,
                    data: json,
                });
            } catch (err) {
                server.close();
                reject(err);
            }
        });
    });
}

async function runFrontendIntegrationTest() {
    console.log('\n================================================================');
    console.log('   سَدِيم (Sadeem) — فحص الربط التكاملي مع الفرونت إند والداتابيز   ');
    console.log('================================================================\n');

    await connectDB();

    // 1. Setup Test Category
    const category = await Category.findOneAndUpdate(
        { slug: 'central-gaza-crafts-test' },
        {
            title: 'حِرف وأزياء الوسطى',
            slug: 'central-gaza-crafts-test',
            variantAttributes: [
                { name: 'color', values: ['أزرق نيلي', 'أبيض سحابي', 'أسود'] },
                { name: 'size', values: ['S', 'M', 'L'] },
            ],
            isActive: true,
        },
        { upsert: true, new: true }
    );
    console.log('✔ [1] تم تجهيز القسم الحقيقي في الداتابيز:', category.title);

    // 2. Setup Test Seller User & Store
    const testUser = await User.create({
        name: 'أبو أحمد النصيرات',
        phoneNumber: `0599${Date.now().toString().slice(-6)}8`,
        email: `seller_integration_${Date.now()}@sadeem.ps`,
        password: 'secure_password_test',
        role: ROLE.SELLER,
        status: STATUS.ACTIVE,
    });

    const testStore = await Store.create({
        ownerId: testUser._id,
        name: 'محيكة النصيرات المركزية',
        categoryId: category._id,
        address: {
            governorate: 'central',
            city: 'nuseirat',
            detailedAddress: 'شارع مخيم النصيرات العام، قرب البريد',
            coordinates: { lat: 31.4485, lng: 34.3914 },
            isDefault: true,
        },
        status: STATUS.ACTIVE,
        approveStatus: APPROVE_STATUS.APPROVED,
    });

    const accessToken = issueAccessToken(testUser);
    const authCookie = { accessToken };
    console.log('✔ [2] تم إنشاء التاجر والمتجر وتوليد جلسة التوثيق الحقيقية');

    // 3. Test GET /api/stores/me (Used by merchantService.getStoreProfile)
    const storeProfileRes = await mockRequest('GET', '/api/stores/me', null, authCookie);
    if (storeProfileRes.status === 200 && storeProfileRes.data?.store?.name === 'محيكة النصيرات المركزية') {
        console.log('✔ [3] [PASS] جلب بيانات المتجر الحقيقية عبر GET /api/stores/me بنجاح');
    } else {
        throw new Error(`فشل جلب بيانات المتجر: ${JSON.stringify(storeProfileRes)}`);
    }

    // 4. Test POST /api/products (Used by merchantService.createProduct from Studio)
    const studioPayload = {
        name: 'قميص كتان مطرز كوزميك',
        title: 'قميص كتان مطرز كوزميك',
        categoryId: String(category._id),
        description: 'قميص من الكتان الطبيعي الفاخر، تفصيل متقن في مخيم النصيرات',
        images: [
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
            'https://images.unsplash.com/photo-1542272604-787c3835535d',
        ],
        options: [
            { key: 'color', label: 'اللون', type: 'COLOR', values: ['أزرق نيلي', 'أبيض سحابي'] },
            { key: 'size', label: 'المقاس', type: 'SIZE', values: ['M', 'L'] },
        ],
        isFeatured: true,
        isAnonymousVendor: true, // ميزة إخفاء هوية المتجر (White-label supply)
        isActive: true,
        variants: [
            {
                attributes: { color: 'أزرق نيلي', size: 'M' },
                sku: 'NS-SHIRT-BLU-M',
                price: 70,
                compareAtPrice: 85,
                stock: 12,
            },
            {
                attributes: { color: 'أزرق نيلي', size: 'L' },
                sku: 'NS-SHIRT-BLU-L',
                price: 75,
                stock: 8,
            },
            {
                attributes: { color: 'أبيض سحابي', size: 'M' },
                sku: 'NS-SHIRT-WHT-M',
                price: 65,
                stock: 15,
            },
        ],
    };

    const createProductRes = await mockRequest('POST', '/api/products', studioPayload, authCookie);
    if (createProductRes.status !== 201 || !createProductRes.data?.product) {
        throw new Error(`فشل إنشاء المنتج من الاستوديو: ${JSON.stringify(createProductRes)}`);
    }

    const createdProd = createProductRes.data.product;
    console.log(`✔ [4] [PASS] إنشاء المنتج والأصناف دفعة واحدة عبر POST /api/products بنجاح: ID=${createdProd._id}`);

    // Verify calculated fields in MongoDB
    const dbProduct = await Product.findById(createdProd._id).lean();
    if (
        dbProduct.minPrice === 65 &&
        dbProduct.maxPrice === 75 &&
        dbProduct.totalStock === 35 &&
        dbProduct.inStock === true &&
        dbProduct.isAnonymousVendor === true &&
        dbProduct.images.length === 2
    ) {
        console.log('✔ [5] [PASS] التحقق المباشر من MongoDB: ملخص الأسعار (65 - 75 ₪)، المخزون (35)، وصور المعرض وإخفاء هوية المتجر سليمة 100%');
    } else {
        throw new Error(`بيانات المنتج في MongoDB غير مطابقة: ${JSON.stringify(dbProduct)}`);
    }

    // 5. Test GET /api/products/:id (Used by Product Studio PDP initial load)
    const getProductRes = await mockRequest('GET', `/api/products/${createdProd._id}`);
    if (
        getProductRes.status === 200 &&
        getProductRes.data?.product?.variants?.length === 3 &&
        getProductRes.data?.product?.isAnonymousVendor === true
    ) {
        console.log('✔ [6] [PASS] جلب المنتج مع كامل أصنافه الحقيقية عبر GET /api/products/:id بنجاح');
    } else {
        throw new Error(`فشل جلب تفاصيل المنتج: ${JSON.stringify(getProductRes)}`);
    }

    // 6. Test PATCH /api/products/:id (Used by Product Studio Save Changes)
    const updatePayload = {
        name: 'قميص كتان مطرز كوزميك - إصدار صيفي',
        description: 'وصف محدث للقميص الفاخر',
        isAnonymousVendor: true,
        variants: [
            ...createdProd.variants.map((v) => {
                if (v.sku === 'NS-SHIRT-BLU-M') {
                    return { ...v, price: 90, stock: 20 }; // تعديل السعر من 70 إلى 90 والمخزون
                }
                return v;
            }),
        ],
    };

    const updateProductRes = await mockRequest('PATCH', `/api/products/${createdProd._id}`, updatePayload, authCookie);
    if (updateProductRes.status !== 200) {
        throw new Error(`فشل تحديث المنتج: ${JSON.stringify(updateProductRes)}`);
    }

    const dbUpdatedProduct = await Product.findById(createdProd._id).lean();
    if (dbUpdatedProduct.maxPrice === 90 && dbUpdatedProduct.totalStock === 43) {
        console.log('✔ [7] [PASS] تحديث المنتج ومصفوفة الأصناف عبر PATCH /api/products/:id وانعكاس أعلى سعر=90 ₪ وإجمالي المخزون=43 في الداتابيز');
    } else {
        throw new Error(`فشل احتساب البيانات بعد التحديث: ${JSON.stringify(dbUpdatedProduct)}`);
    }

    // 7. Test GET /api/products/merchant/my-products (Used by Merchant Dashboard Product List)
    const listRes = await mockRequest('GET', '/api/products/merchant/my-products', null, authCookie);
    if (
        listRes.status === 200 &&
        Array.isArray(listRes.data?.products) &&
        listRes.data.products.some((p) => String(p._id) === String(createdProd._id))
    ) {
        console.log('✔ [8] [PASS] جلب قائمة منتجات التاجر في الداشبورد عبر GET /api/products/merchant/my-products بنجاح');
    } else {
        throw new Error(`فشل جلب قائمة منتجات التاجر: ${JSON.stringify(listRes)}`);
    }

    // 8. Test PATCH /api/products/:id/status (Toggle product active status)
    const toggleRes = await mockRequest('PATCH', `/api/products/${createdProd._id}/status`, { status: 'inActive' }, authCookie);
    const dbToggled = await Product.findById(createdProd._id).lean();
    if (toggleRes.status === 200 && dbToggled.status === 'inActive' && dbToggled.isActive === false) {
        console.log('✔ [9] [PASS] تبديل حالة نشاط المنتج عبر PATCH /api/products/:id/status وانعكاسها على الداتابيز بنجاح');
    } else {
        throw new Error(`فشل تبديل حالة المنتج: ${JSON.stringify(toggleRes)}`);
    }

    // 9. Test DELETE /api/products/:id (Soft Delete)
    const deleteRes = await mockRequest('DELETE', `/api/products/${createdProd._id}`, null, authCookie);
    const dbDeleted = await Product.findById(createdProd._id).lean();
    const variantsDeleted = await Variant.find({ productId: createdProd._id }).lean();
    if (deleteRes.status === 200 && dbDeleted.isDeleted === true && variantsDeleted.every((v) => v.isDeleted === true)) {
        console.log('✔ [10] [PASS] الحذف الناعم للمنتج وكافة أصنافه التابعة عبر DELETE /api/products/:id بنجاح تام');
    } else {
        throw new Error(`فشل الحذف الناعم: ${JSON.stringify(deleteRes)}`);
    }

    // Cleanup Test Data
    await Variant.deleteMany({ productId: createdProd._id });
    await Product.deleteOne({ _id: createdProd._id });
    await Store.deleteOne({ _id: testStore._id });
    await User.deleteOne({ _id: testUser._id });
    await Category.deleteOne({ _id: category._id });

    console.log('\n✨ جميع فحوصات الربط التكاملي بين واجهة التاجر والداتابيز اجتازت بنجاح 100% دون أي خطأ!\n');
    await mongoose.disconnect();
}

runFrontendIntegrationTest().catch((err) => {
    console.error('Integration Test Failed:', err);
    process.exit(1);
});
