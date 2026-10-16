const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { connectDB } = require('../config/db');
const { ROLE, STATUS, APPROVE_STATUS, STORE_APPROVE_STATUS } = require('../constants/enums');
const User = require('../models/User');
const Store = require('../models/Store');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const OptionDefinition = require('../models/OptionDefinition');
const Region = require('../models/Region');
const Wallet = require('../models/Wallet');
const { recomputeProductSummary } = require('../utils/product');

async function seedCompleteSadeem() {
    console.log('====================================================');
    console.log('🌌 سَدِيم — بدء تصفير وإعادة بناء قاعدة البيانات بالكامل');
    console.log('====================================================');

    await connectDB();

    // 1. Wipe all legacy records
    console.log('🧹 [1/6] جاري حذف كافة البيانات القديمة المكررة والمعطوبة...');
    await Promise.all([
        Product.deleteMany({}),
        Variant.deleteMany({}),
        Category.deleteMany({}),
        Store.deleteMany({}),
        User.deleteMany({}),
        OptionDefinition.deleteMany({}),
        Region.deleteMany({}),
        Wallet.deleteMany({}),
    ]);
    console.log('✔ تم تصفير كافة الجداول بنجاح (Clean Slate).');

    // 2. Seed Central Gaza Regions
    console.log('📍 [2/6] جاري زرع مناطق المحافظة الوسطى المعتمدة...');
    const regionsData = [
        { name: 'دير البلح', code: 'deir_albalah', deliveryFee: 8, isActive: true },
        { name: 'مخيم النصيرات', code: 'nuseirat', deliveryFee: 8, isActive: true },
        { name: 'الزوايدة', code: 'zawayda', deliveryFee: 8, isActive: true },
        { name: 'مخيم المغازي', code: 'maghazi', deliveryFee: 8, isActive: true },
        { name: 'مخيم البريج', code: 'bureij', deliveryFee: 8, isActive: true },
    ];
    await Region.insertMany(regionsData);
    console.log('✔ تم زرع 5 مناطق للمحافظة الوسطى بأجر موحد 8 ₪.');

    // 3. Seed Canonical Categories with variantAttributes
    console.log('🏷️ [3/6] جاري زرع تصنيفات سَدِيم مع سمات المتغيرات الصريحة...');
    const categoriesData = [
        {
            title: 'ملابس وأزياء',
            slug: 'fashion',
            icon: 'shirt',
            order: 1,
            isActive: true,
            variantAttributes: [
                {
                    name: 'اللون',
                    values: ['أخضر زيتي ملكي', 'بيج الفخار', 'أسود منجنيزي', 'تراب الصلصال', 'أزرق نيلي'],
                },
                {
                    name: 'المقاس',
                    values: ['S', 'M', 'L', 'XL', '2XL'],
                },
            ],
            allowedOptions: ['color', 'size_clothing'],
        },
        {
            title: 'أحذية وحقائب',
            slug: 'shoes-bags',
            icon: 'footprints',
            order: 2,
            isActive: true,
            variantAttributes: [
                {
                    name: 'اللون',
                    values: ['أسود كلاسيكي', 'بني كرمي', 'بيج رملي'],
                },
                {
                    name: 'المقاس',
                    values: ['39', '40', '41', '42', '43', '44', '45'],
                },
            ],
            allowedOptions: ['color', 'size_shoes'],
        },
        {
            title: 'طاقة وبدائل',
            slug: 'energy-power',
            icon: 'zap',
            order: 3,
            isActive: true,
            variantAttributes: [
                {
                    name: 'سعة البطارية',
                    values: ['500W / 45Ah', '1000W / 90Ah', '1200W / 120Ah', '1800W / 150Ah'],
                },
                {
                    name: 'اللون',
                    values: ['رمادي داكن', 'برتقالي شمسي'],
                },
            ],
            allowedOptions: ['color', 'battery_capacity'],
        },
        {
            title: 'شبكات واتصالات',
            slug: 'networks',
            icon: 'wifi',
            order: 4,
            isActive: true,
            variantAttributes: [
                {
                    name: 'سعة البطارية',
                    values: ['3000mAh', '5000mAh', '10000mAh'],
                },
                {
                    name: 'اللون',
                    values: ['أبيض ناصع', 'أسود مطفي'],
                },
            ],
            allowedOptions: ['color', 'battery_capacity'],
        },
        {
            title: 'مؤونة وزيت زيتون',
            slug: 'provisions',
            icon: 'wheat',
            order: 5,
            isActive: true,
            variantAttributes: [
                {
                    name: 'الحجم / السعة',
                    values: ['1 لتر', '3 لتر', '5 لتر', '16 لتر (تنكة)'],
                },
            ],
            allowedOptions: ['volume', 'weight'],
        },
        {
            title: 'عطور وعناية',
            slug: 'perfumes-care',
            icon: 'sparkles',
            order: 6,
            isActive: true,
            variantAttributes: [
                {
                    name: 'الحجم / السعة',
                    values: ['50 مل', '100 مل', '200 مل'],
                },
            ],
            allowedOptions: ['volume'],
        },
    ];

    const categories = await Category.insertMany(categoriesData);
    const catMap = {};
    categories.forEach((c) => {
        catMap[c.slug] = c;
    });
    console.log(`✔ تم زرع ${categories.length} تصنيفات معتمدة.`);

    // Also seed option definitions for backwards compatibility
    const defaultOptionDefs = [
        {
            key: 'color',
            label: 'اللون',
            type: 'COLOR',
            unit: null,
            values: [
                { key: 'green_olive', label: 'أخضر زيتي ملكي', hex: '#5E6B4A', sortOrder: 1 },
                { key: 'clay', label: 'تراب الصلصال', hex: '#A85A3C', sortOrder: 2 },
                { key: 'black', label: 'أسود منجنيزي', hex: '#2B2420', sortOrder: 3 },
                { key: 'beige', label: 'بيج الفخار', hex: '#D9CEBC', sortOrder: 4 },
                { key: 'blue_indigo', label: 'أزرق نيلي', hex: '#1E3A8A', sortOrder: 5 },
            ],
        },
        {
            key: 'size_clothing',
            label: 'مقاس الملابس',
            type: 'SIZE',
            unit: null,
            values: [
                { key: 's', label: 'S', sortOrder: 1 },
                { key: 'm', label: 'M', sortOrder: 2 },
                { key: 'l', label: 'L', sortOrder: 3 },
                { key: 'xl', label: 'XL', sortOrder: 4 },
                { key: '2xl', label: '2XL', sortOrder: 5 },
            ],
        },
        {
            key: 'size_shoes',
            label: 'مقاس الأحذية',
            type: 'SIZE',
            unit: null,
            values: [
                { key: '39', label: '39', sortOrder: 1 },
                { key: '40', label: '40', sortOrder: 2 },
                { key: '41', label: '41', sortOrder: 3 },
                { key: '42', label: '42', sortOrder: 4 },
                { key: '43', label: '43', sortOrder: 5 },
                { key: '44', label: '44', sortOrder: 6 },
                { key: '45', label: '45', sortOrder: 7 },
            ],
        },
    ];
    for (const def of defaultOptionDefs) {
        await OptionDefinition.create(def);
    }

    // 4. Seed Verified Sellers, Stores and Admin
    console.log('🏪 [4/6] جاري إنشاء حسابات التجار والمتاجر الموثقة...');
    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
    const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);

    // Merchant 1 (Main test merchant)
    const sellerUser1 = await User.create({
        name: 'أحمد شملخ',
        phoneNumber: '0599111222',
        email: 'seller@sadeem.ps',
        password: defaultPasswordHash,
        role: ROLE.SELLER,
        status: STATUS.ACTIVE,
    });
    const store1 = await Store.create({
        ownerId: sellerUser1._id,
        name: 'خيوط سَدِيم للأزياء المركزية',
        categoryId: catMap['fashion']._id,
        logo: '/canaan_icon_squircle_transparent.png',
        description: 'دار أزياء فلسطينية متخصصة في حياكة الصوف الممشط والقطن الفاخر في دير البلح.',
        address: {
            governorate: 'central',
            city: 'deir_albalah',
            detailedAddress: 'دير البلح · شارع النخيل الرئيسي',
        },
        balance: 420,
        status: STATUS.ACTIVE,
        approveStatus: STORE_APPROVE_STATUS.APPROVED,
    });
    await Wallet.create({ userId: sellerUser1._id, balance: 420 });

    // Merchant 2 (Energy)
    const sellerUser2 = await User.create({
        name: 'م. رامي النجار',
        phoneNumber: '0599222333',
        email: 'energy@sadeem.ps',
        password: defaultPasswordHash,
        role: ROLE.SELLER,
        status: STATUS.ACTIVE,
    });
    const store2 = await Store.create({
        ownerId: sellerUser2._id,
        name: 'واحة الطاقة والبدائل',
        categoryId: catMap['energy-power']._id,
        logo: '/canaan_power_station_transparent.png',
        description: 'حلول الطاقة النظيفة وبطاريات الليثيوم والشواحن الشمسية المتنقلة للمحافظة الوسطى.',
        address: {
            governorate: 'central',
            city: 'nuseirat',
            detailedAddress: 'مخيم النصيرات · شارع صلاح الدين',
        },
        balance: 850,
        status: STATUS.ACTIVE,
        approveStatus: STORE_APPROVE_STATUS.APPROVED,
    });
    await Wallet.create({ userId: sellerUser2._id, balance: 850 });

    // Merchant 3 (Provisions)
    const sellerUser3 = await User.create({
        name: 'الحاج أبو عثمان الرومي',
        phoneNumber: '0599333444',
        email: 'provisions@sadeem.ps',
        password: defaultPasswordHash,
        role: ROLE.SELLER,
        status: STATUS.ACTIVE,
    });
    const store3 = await Store.create({
        ownerId: sellerUser3._id,
        name: 'معاصر النصيرات الحديثة',
        categoryId: catMap['provisions']._id,
        logo: '/canaan_olive_amphora_transparent.png',
        description: 'عصر الزيتون البلدي الرومي على البارد وحفظ المؤونة الفلسطينية الأصيلة.',
        address: {
            governorate: 'central',
            city: 'zawayda',
            detailedAddress: 'الزوايدة · قرب شارع البحر',
        },
        balance: 310,
        status: STATUS.ACTIVE,
        approveStatus: STORE_APPROVE_STATUS.APPROVED,
    });
    await Wallet.create({ userId: sellerUser3._id, balance: 310 });

    // Merchant 4 (Networks)
    const sellerUser4 = await User.create({
        name: 'خالد سلامة',
        phoneNumber: '0599444555',
        email: 'tech@sadeem.ps',
        password: defaultPasswordHash,
        role: ROLE.SELLER,
        status: STATUS.ACTIVE,
    });
    const store4 = await Store.create({
        ownerId: sellerUser4._id,
        name: 'واحة التقنية والاتصالات',
        categoryId: catMap['networks']._id,
        logo: '/canaan_icon_squircle_transparent.png',
        description: 'أجهزة الاتصالات المتنقلة والراوترات الذكية المقاومة لانقطاع التيار الكهربائي.',
        address: {
            governorate: 'central',
            city: 'deir_albalah',
            detailedAddress: 'دير البلح · شارع الشهداء',
        },
        balance: 150,
        status: STATUS.ACTIVE,
        approveStatus: STORE_APPROVE_STATUS.APPROVED,
    });
    await Wallet.create({ userId: sellerUser4._id, balance: 150 });

    // Admin Account
    const adminUser = await User.create({
        name: 'إدارة منصة سَدِيم المركزية',
        phoneNumber: '0599000111',
        email: 'admin@sadeem.ps',
        password: adminPasswordHash,
        role: ROLE.ADMIN,
        status: STATUS.ACTIVE,
    });
    await Wallet.create({ userId: adminUser._id, balance: 5000 });
    console.log('✔ تم إنشاء حسابات التجار وحساب الإدارة بنجاح.');

    // 5. Seed Real Products & Variants
    console.log('📦 [5/6] جاري إنشاء المنتجات الحقيقية بمتغيراتها وصورها الكاملة...');

    // Helper to insert product + variants
    async function createFullProduct({
        store,
        category,
        title,
        slug,
        description,
        image,
        images,
        options,
        variantsList,
        isFeatured = false,
    }) {
        const prod = await Product.create({
            storeId: store._id,
            categoryId: category._id,
            title,
            slug,
            description,
            image,
            images,
            options,
            isFeatured,
            status: STATUS.ACTIVE,
            approveStatus: APPROVE_STATUS.APPROVED,
            isActive: true,
        });

        const variantDocs = variantsList.map((v) => ({
            productId: prod._id,
            storeId: store._id,
            sku: v.sku,
            attributes: v.attributes,
            attrKey: v.attrKey,
            price: v.price,
            compareAtPrice: v.compareAtPrice || null,
            stock: v.stock,
            image: v.image || image,
            images: v.images || images,
            status: STATUS.ACTIVE,
            approveStatus: APPROVE_STATUS.APPROVED,
            isDeleted: false,
        }));

        await Variant.insertMany(variantDocs);
        await recomputeProductSummary(prod._id);
        return prod;
    }

    // Product 1: Sadeem Wool Hoodie (Under store1 - seller@sadeem.ps)
    await createFullProduct({
        store: store1,
        category: catMap['fashion'],
        title: 'كنزة سَدِيم الصوفية بغطاء رأس من القطن الممشط الفاخر',
        slug: 'sadeem-wool-hoodie-luxury',
        description: 'كنزة صوفية فاخرة مصنوعة من القطن الفلسطيني الممشط فائق النعومة بوزن 380 GSM، خياطة متينة ومريحة في الشتاء مع لمسات حريرية ناعمة.',
        image: '/canaan_product_hoodie_olive.jpg',
        images: ['/canaan_product_hoodie_olive.jpg', '/canaan_product_hoodie_clay.jpg', '/canaan_product_hoodie_detail.jpg'],
        isFeatured: true,
        options: [
            {
                key: 'اللون',
                label: 'اللون',
                type: 'COLOR',
                values: ['أخضر زيتي ملكي', 'تراب الصلصال', 'أسود منجنيزي'],
            },
            {
                key: 'المقاس',
                label: 'المقاس',
                type: 'SIZE',
                values: ['M', 'L', 'XL'],
            },
        ],
        variantsList: [
            { sku: 'SDM-HOD-GRN-M', attributes: { 'اللون': 'أخضر زيتي ملكي', 'المقاس': 'M' }, attrKey: 'اللون:أخضر زيتي ملكي|المقاس:M', price: 135, compareAtPrice: 175, stock: 12, image: '/canaan_product_hoodie_olive.jpg' },
            { sku: 'SDM-HOD-GRN-L', attributes: { 'اللون': 'أخضر زيتي ملكي', 'المقاس': 'L' }, attrKey: 'اللون:أخضر زيتي ملكي|المقاس:L', price: 135, compareAtPrice: 175, stock: 18, image: '/canaan_product_hoodie_olive.jpg' },
            { sku: 'SDM-HOD-GRN-XL', attributes: { 'اللون': 'أخضر زيتي ملكي', 'المقاس': 'XL' }, attrKey: 'اللون:أخضر زيتي ملكي|المقاس:XL', price: 140, compareAtPrice: 180, stock: 8, image: '/canaan_product_hoodie_olive.jpg' },
            { sku: 'SDM-HOD-CLA-M', attributes: { 'اللون': 'تراب الصلصال', 'المقاس': 'M' }, attrKey: 'اللون:تراب الصلصال|المقاس:M', price: 135, compareAtPrice: 175, stock: 10, image: '/canaan_product_hoodie_clay.jpg' },
            { sku: 'SDM-HOD-CLA-L', attributes: { 'اللون': 'تراب الصلصال', 'المقاس': 'L' }, attrKey: 'اللون:تراب الصلصال|المقاس:L', price: 135, compareAtPrice: 175, stock: 15, image: '/canaan_product_hoodie_clay.jpg' },
            { sku: 'SDM-HOD-CLA-XL', attributes: { 'اللون': 'تراب الصلصال', 'المقاس': 'XL' }, attrKey: 'اللون:تراب الصلصال|المقاس:XL', price: 140, compareAtPrice: 180, stock: 6, image: '/canaan_product_hoodie_clay.jpg' },
            { sku: 'SDM-HOD-BLK-M', attributes: { 'اللون': 'أسود منجنيزي', 'المقاس': 'M' }, attrKey: 'اللون:أسود منجنيزي|المقاس:M', price: 135, compareAtPrice: 175, stock: 14, image: '/canaan_product_hoodie_detail.jpg' },
            { sku: 'SDM-HOD-BLK-L', attributes: { 'اللون': 'أسود منجنيزي', 'المقاس': 'L' }, attrKey: 'اللون:أسود منجنيزي|المقاس:L', price: 135, compareAtPrice: 175, stock: 20, image: '/canaan_product_hoodie_detail.jpg' },
            { sku: 'SDM-HOD-BLK-XL', attributes: { 'اللون': 'أسود منجنيزي', 'المقاس': 'XL' }, attrKey: 'اللون:أسود منجنيزي|المقاس:XL', price: 140, compareAtPrice: 180, stock: 9, image: '/canaan_product_hoodie_detail.jpg' },
        ],
    });

    // Product 2: Natural Linen Shirt (Under store1 - seller@sadeem.ps)
    await createFullProduct({
        store: store1,
        category: catMap['fashion'],
        title: 'قميص كتان طبيعي فاخر بأزرار خشبية',
        slug: 'linen-natural-shirt-luxury',
        description: 'قميص رجالي مصمم من قماش الكتان الطبيعي الفاخر، مريح في درجات الحرارة المرتفعة مع تفصيل خياطة يدوي متين وأزرار خشبية معتقة.',
        image: '/canaan_product_hoodie_clay.jpg',
        images: ['/canaan_product_hoodie_clay.jpg', '/canaan_product_hoodie_detail.jpg'],
        isFeatured: false,
        options: [
            {
                key: 'اللون',
                label: 'اللون',
                type: 'COLOR',
                values: ['بيج الفخار', 'أسود منجنيزي'],
            },
            {
                key: 'المقاس',
                label: 'المقاس',
                type: 'SIZE',
                values: ['M', 'L', 'XL'],
            },
        ],
        variantsList: [
            { sku: 'SDM-SHR-BEG-M', attributes: { 'اللون': 'بيج الفخار', 'المقاس': 'M' }, attrKey: 'اللون:بيج الفخار|المقاس:M', price: 95, compareAtPrice: 120, stock: 8, image: '/canaan_product_hoodie_clay.jpg' },
            { sku: 'SDM-SHR-BEG-L', attributes: { 'اللون': 'بيج الفخار', 'المقاس': 'L' }, attrKey: 'اللون:بيج الفخار|المقاس:L', price: 95, compareAtPrice: 120, stock: 12, image: '/canaan_product_hoodie_clay.jpg' },
            { sku: 'SDM-SHR-BEG-XL', attributes: { 'اللون': 'بيج الفخار', 'المقاس': 'XL' }, attrKey: 'اللون:بيج الفخار|المقاس:XL', price: 100, compareAtPrice: 125, stock: 5, image: '/canaan_product_hoodie_clay.jpg' },
            { sku: 'SDM-SHR-BLK-M', attributes: { 'اللون': 'أسود منجنيزي', 'المقاس': 'M' }, attrKey: 'اللون:أسود منجنيزي|المقاس:M', price: 95, compareAtPrice: 120, stock: 7, image: '/canaan_product_hoodie_detail.jpg' },
            { sku: 'SDM-SHR-BLK-L', attributes: { 'اللون': 'أسود منجنيزي', 'المقاس': 'L' }, attrKey: 'اللون:أسود منجنيزي|المقاس:L', price: 95, compareAtPrice: 120, stock: 10, image: '/canaan_product_hoodie_detail.jpg' },
            { sku: 'SDM-SHR-BLK-XL', attributes: { 'اللون': 'أسود منجنيزي', 'المقاس': 'XL' }, attrKey: 'اللون:أسود منجنيزي|المقاس:XL', price: 100, compareAtPrice: 125, stock: 4, image: '/canaan_product_hoodie_detail.jpg' },
        ],
    });

    // Product 3: Power Station (Under store2)
    await createFullProduct({
        store: store2,
        category: catMap['energy-power'],
        title: 'محطة طاقة ليثيوم محمولة 1200W مع شاحن شمسي سريع',
        slug: 'power-station-lithium-1200w',
        description: 'محطة طاقة ليثيوم LiFePO4 متطورة بقوة 1200W صافية، تدعم تشغيل الأجهزة الأساسية والإنارة وشحن الهواتف، مع مدخل طاقة شمسية عالي الكفاءة يدوم لأكثر من 3000 دورة شحن.',
        image: '/canaan_power_station_transparent.png',
        images: ['/canaan_power_station_transparent.png', '/canaan_power_station_1788773915636.jpg'],
        isFeatured: true,
        options: [
            {
                key: 'سعة البطارية',
                label: 'سعة البطارية',
                type: 'NUMERIC',
                values: ['1000W / 90Ah', '1200W / 120Ah'],
            },
            {
                key: 'اللون',
                label: 'اللون',
                type: 'COLOR',
                values: ['رمادي داكن', 'برتقالي شمسي'],
            },
        ],
        variantsList: [
            { sku: 'SDM-PWR-1000-GRY', attributes: { 'سعة البطارية': '1000W / 90Ah', 'اللون': 'رمادي داكن' }, attrKey: 'سعة البطارية:1000W / 90Ah|اللون:رمادي داكن', price: 1650, compareAtPrice: 1900, stock: 6, image: '/canaan_power_station_transparent.png' },
            { sku: 'SDM-PWR-1200-GRY', attributes: { 'سعة البطارية': '1200W / 120Ah', 'اللون': 'رمادي داكن' }, attrKey: 'سعة البطارية:1200W / 120Ah|اللون:رمادي داكن', price: 1850, compareAtPrice: 2100, stock: 8, image: '/canaan_power_station_transparent.png' },
            { sku: 'SDM-PWR-1200-ORG', attributes: { 'سعة البطارية': '1200W / 120Ah', 'اللون': 'برتقالي شمسي' }, attrKey: 'سعة البطارية:1200W / 120Ah|اللون:برتقالي شمسي', price: 1850, compareAtPrice: 2100, stock: 5, image: '/canaan_power_station_1788773915636.jpg' },
        ],
    });

    // Product 4: Olive Oil Amphora (Under store3)
    await createFullProduct({
        store: store3,
        category: catMap['provisions'],
        title: 'خابية زيت زيتون بكر رومي نمرة 1 معصورة على البارد',
        slug: 'olive-oil-amphora-rumi',
        description: 'زيت زيتون فلسطيني بلدي رومي معصور على البارد من حقول المحافظة الوسطى، محفوظ بعناية فائقة لضمان بقاء النكهة والرائحة الأصيلة وفوائده الصحية العالية.',
        image: '/canaan_olive_amphora_transparent.png',
        images: ['/canaan_olive_amphora_transparent.png', '/canaan_olive_amphora_1788773956733.jpg'],
        isFeatured: true,
        options: [
            {
                key: 'الحجم / السعة',
                label: 'الحجم / السعة',
                type: 'NUMERIC',
                values: ['1 لتر', '3 لتر', '5 لتر'],
            },
        ],
        variantsList: [
            { sku: 'SDM-OIL-1L', attributes: { 'الحجم / السعة': '1 لتر' }, attrKey: 'الحجم / السعة:1 لتر', price: 45, compareAtPrice: 55, stock: 40, image: '/canaan_olive_amphora_transparent.png' },
            { sku: 'SDM-OIL-3L', attributes: { 'الحجم / السعة': '3 لتر' }, attrKey: 'الحجم / السعة:3 لتر', price: 130, compareAtPrice: 155, stock: 25, image: '/canaan_olive_amphora_1788773956733.jpg' },
            { sku: 'SDM-OIL-5L', attributes: { 'الحجم / السعة': '5 لتر' }, attrKey: 'الحجم / السعة:5 لتر', price: 210, compareAtPrice: 245, stock: 15, image: '/canaan_olive_amphora_1788773956733.jpg' },
        ],
    });

    // Product 5: Portable 4G Router (Under store4)
    await createFullProduct({
        store: store4,
        category: catMap['networks'],
        title: 'راوتر متنقل 4G LTE منزلي مع بطارية 5000mAh مدمجة',
        slug: 'router-4g-lte-portable',
        description: 'راوتر متنقل فائق السرعة يدعم كافة شبكات الاتصال في غزة ومزود ببطارية تدوم حتى 12 ساعة متواصلة في ظروف انقطاع الكهرباء.',
        image: '/canaan_router_4g_1788788459540.jpg',
        images: ['/canaan_router_4g_1788788459540.jpg'],
        isFeatured: false,
        options: [
            {
                key: 'اللون',
                label: 'اللون',
                type: 'COLOR',
                values: ['أبيض ناصع', 'أسود مطفي'],
            },
        ],
        variantsList: [
            { sku: 'SDM-RTR-WHT', attributes: { 'اللون': 'أبيض ناصع' }, attrKey: 'اللون:أبيض ناصع', price: 240, compareAtPrice: 280, stock: 14, image: '/canaan_router_4g_1788788459540.jpg' },
            { sku: 'SDM-RTR-BLK', attributes: { 'اللون': 'أسود مطفي' }, attrKey: 'اللون:أسود مطفي', price: 240, compareAtPrice: 280, stock: 9, image: '/canaan_router_4g_1788788459540.jpg' },
        ],
    });

    console.log('✔ تم إنشاء كافة المنتجات والمتغيرات بنجاح وحساب ملخصاتها بدقة.');

    console.log('====================================================');
    console.log('🎉 اكتملت عملية التهيئة وإعادة بناء قاعدة البيانات!');
    console.log('🔑 حساب التاجر التجريبي المعتمد:');
    console.log('   البريد: seller@sadeem.ps');
    console.log('   كلمة المرور: Password123!');
    console.log('   المتجر: خيوط سَدِيم للأزياء المركزية');
    console.log('🔑 حساب الإدارة (Admin):');
    console.log('   البريد: admin@sadeem.ps');
    console.log('   كلمة المرور: AdminPassword123!');
    console.log('====================================================');
}

if (require.main === module) {
    seedCompleteSadeem()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('❌ خطأ أثناء عملية الزرع:', err);
            process.exit(1);
        });
}

module.exports = seedCompleteSadeem;
