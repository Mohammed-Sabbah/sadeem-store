const mongoose = require('mongoose');
require('dotenv').config();

const { GAZA_REGIONS } = require('../constants/gaza-regions');
const Region = require('../models/Region');
const { calculateDeliveryFee, calculateHaversineDistance } = require('../utils/deliveryCalculator');
const { MIN_FEE, MAX_FEE } = require('../constants/delivery');

async function runRegionTestSuite() {
    console.log('\n======================================================');
    console.log('   سَدِيم (Sadeem) — فحص منظومة المحافظات والحالات الثلاث   ');
    console.log('======================================================\n');

    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/sadeem_db';
    await mongoose.connect(uri);
    console.log('✔ اتصال سليم بقاعدة البيانات MongoDB');

    try {
        // 1. فحص بذور المحافظات
        const { ensureRegionsSeeded } = require('../controllers/regionController');
        await ensureRegionsSeeded();

        const count = await Region.countDocuments();
        if (count !== 5) {
            throw new Error(`Expected 5 regions, got ${count}`);
        }
        console.log(`✔ [PASS] عدد المحافظات في قاعدة البيانات: ${count}`);

        // 2. فحص الحالات الثلاث
        const central = await Region.findOne({ code: 'central' });
        const khanYounis = await Region.findOne({ code: 'khan_younis' });
        const gaza = await Region.findOne({ code: 'gaza' });

        if (central.status !== 'hub') throw new Error(`Central status should be 'hub', got ${central.status}`);
        if (!central.isHub) throw new Error('Central virtual isHub should be true');
        if (!central.isDeliveryAllowed) throw new Error('Central isDeliveryAllowed should be true');
        console.log('✔ [PASS] المحافظة الوسطى: status="hub" (مركز نشط للمتاجر والزبائن)');

        if (khanYounis.status !== 'delivery_only') throw new Error(`Khan Younis status should be 'delivery_only', got ${khanYounis.status}`);
        if (khanYounis.isHub) throw new Error('Khan Younis virtual isHub should be false');
        if (!khanYounis.isDeliveryAllowed) throw new Error('Khan Younis virtual isDeliveryAllowed should be true');
        console.log('✔ [PASS] خان يونس: status="delivery_only" (توصيل زبائن فقط، ومغلق للمتاجر)');

        if (gaza.status !== 'closed') throw new Error(`Gaza status should be 'closed', got ${gaza.status}`);
        if (gaza.isHub || gaza.isDeliveryAllowed) throw new Error('Gaza should not be hub or delivery allowed');
        console.log('✔ [PASS] مدينة غزة وباقي المحافظات: status="closed" (خارج التغطية حالياً)');

        // 3. فحص احتساب التوصيل بالمسافات الديناميكية و Haversine والحد الأدنى والأقصى
        const storeInDeirAlBalah = {
            id: 'store-1',
            name: 'متجر التمور الأصيل',
            address: {
                governorate: 'central',
                city: 'deir_albalah',
                coordinates: { lat: 31.418, lng: 34.351 },
            },
        };

        // زبون في دير البلح (قريب جداً - يختبر الـ MIN_FEE)
        const nearCustomerAddress = {
            governorate: 'central',
            city: 'deir_albalah',
            coordinates: { lat: 31.420, lng: 34.353 },
        };

        const nearCalc = calculateDeliveryFee([storeInDeirAlBalah], nearCustomerAddress);
        if (nearCalc.totalFee < MIN_FEE) {
            throw new Error(`Near delivery fee should not be less than MIN_FEE (${MIN_FEE}), got ${nearCalc.totalFee}`);
        }
        console.log(`✔ [PASS] حساب التوصيل القريب (الحد الأدنى محترم): ${nearCalc.totalFee} ₪ (الحد الأدنى: ${MIN_FEE} ₪)`);

        // زبون في خان يونس (مسافة أبعد)
        const kyCustomerAddress = {
            governorate: 'khan_younis',
            city: 'khan_younis_city',
            coordinates: { lat: 31.346, lng: 34.306 },
        };

        const kyCalc = calculateDeliveryFee([storeInDeirAlBalah], kyCustomerAddress);
        const dist = calculateHaversineDistance(
            storeInDeirAlBalah.address.coordinates.lat,
            storeInDeirAlBalah.address.coordinates.lng,
            kyCustomerAddress.coordinates.lat,
            kyCustomerAddress.coordinates.lng
        );
        console.log(`✔ [PASS] حساب توصيل دير البلح -> خان يونس: المسافة ${dist} كم -> الرسوم: ${kyCalc.totalFee} ₪ (بين ${MIN_FEE} ₪ و ${MAX_FEE} ₪)`);

        if (kyCalc.totalFee < MIN_FEE || kyCalc.totalFee > MAX_FEE) {
            throw new Error(`Fee out of bounds: ${kyCalc.totalFee}`);
        }

        // 4. فحص ديناميكية الترقية اللحظية (تفعيل خانيونس كـ Hub بدون تعديل كود)
        const { validateSellerStore } = require('../schemas/storeSchema');
        const { validationResult } = require('express-validator');

        async function validateStoreMock(req) {
            for (const v of validateSellerStore) {
                if (typeof v.run === 'function') await v.run(req);
            }
            return validationResult(req);
        }

        const sampleCategory = await mongoose.connection.db.collection('categories').findOne({});
        const kyStoreReq = {
            body: {
                user: { name: 'تاجر خانيونس', phoneNumber: '0599111222', email: 'ky@sadeem.ps', password: 'Password123' },
                store: {
                    name: 'متجر خانيونس الحديث',
                    categoryId: sampleCategory ? sampleCategory._id.toString() : '6ac0efc78f88d03070c48ab8',
                    address: {
                        governorate: 'khan_younis',
                        city: 'khan_younis_city',
                        detailedAddress: 'شارع جلال وسط البلد',
                        coordinates: { lat: 31.346, lng: 34.306 },
                    },
                },
            },
        };

        // قبل الترقية (حالة delivery_only) -> يجب أن يُرفض
        const preUpgradeRes = await validateStoreMock(kyStoreReq);
        if (preUpgradeRes.isEmpty()) {
            throw new Error('فشل الفحص: كان يجب رفض تسجيل متجر خانيونس قبل الترقية!');
        }
        console.log('✔ [PASS] رفض متجر خان يونس قبل الترقية (delivery_only) بنجاح');

        // ترقية خانيونس ديناميكياً في الداتا بيز إلى hub
        await Region.updateOne({ code: 'khan_younis' }, { $set: { status: 'hub' } });
        console.log('⚡ ترقية حالة خان يونس في قاعدة البيانات إلى: hub');

        // بعد الترقية مباشرة -> يجب أن يُقبل فوراً بدون لمس أي كود!
        const postUpgradeReq = { body: JSON.parse(JSON.stringify(kyStoreReq.body)) };
        const postUpgradeRes = await validateStoreMock(postUpgradeReq);
        if (!postUpgradeRes.isEmpty()) {
            console.error('Validation errors post upgrade:', postUpgradeRes.array());
            throw new Error('فشل الفحص: كان يجب قبول متجر خانيونس بعد الترقية إلى hub!');
        }
        console.log('✔ [PASS] قبول متجر خان يونس فورياً بعد الترقية إلى hub بنجاح 100%!');

        // إعادة حالة خانيونس إلى delivery_only لحفظ حالة المرحلة الأولى
        await Region.updateOne({ code: 'khan_younis' }, { $set: { status: 'delivery_only' } });
        console.log('✔ [PASS] إعادة حالة خان يونس إلى delivery_only لحفظ إعدادات المرحلة الأولى');

        console.log('\n✨ كافة اختبارات منظومة المحافظات والحالات الثلاث والتوصيل الديناميكي اجتازت بنجاح 100%!\n');
    } catch (e) {
        console.error('❌ خطأ في الفحص:', e);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

runRegionTestSuite();
