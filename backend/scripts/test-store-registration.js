const mongoose = require('mongoose');
const { validateSellerStore } = require('../schemas/storeSchema');
const Store = require('../models/Store');
const User = require('../models/User');
const Category = require('../models/Category');
const Region = require('../models/Region');

async function runStoreRegistrationVerification() {
    console.log('\n======================================================');
    console.log('   سَدِيم (Sadeem) — فحص تسجيل التاجر والـ GPS والداتا بيز   ');
    console.log('======================================================\n');

    await mongoose.connect('mongodb://127.0.0.1:27017/sadeem_db');
    console.log('✔ اتصال سليم بقاعدة البيانات sadeem_db');

    // 1. Categories in DB
    const categories = await Category.find({ isActive: true }).lean();
    console.log(`✔ [PASS] التصنيفات من الداتا بيز: متوفر ${categories.length} تصنيف`);
    if (categories.length === 0) {
        throw new Error('لا توجد تصنيفات في الداتا بيز!');
    }
    const sampleCategory = categories[0];

    // 2. Regions in DB
    const regions = await Region.find().lean();
    console.log(`✔ [PASS] المحافظات والمدن من الداتا بيز: متوفر ${regions.length} محافظات`);
    if (regions.length === 0) {
        throw new Error('لا توجد محافظات في الداتا بيز!');
    }

    // 3. Test Store Schema Validation Simulation
    const { validationResult } = require('express-validator');

    async function validateMock(req) {
        // Run all validators in the chain (except the trailing validateRequest middleware)
        for (const validator of validateSellerStore) {
            if (typeof validator.run === 'function') {
                await validator.run(req);
            }
        }
        return validationResult(req);
    }

    // A: Missing GPS coordinates
    const reqMissingGps = {
        body: {
            user: { name: 'تاجر تجريبي', phoneNumber: '0599111222', email: 'test@sadeem.ps', password: 'Password123' },
            store: {
                name: 'متجر تجريبي بدون موقع',
                categoryId: sampleCategory._id.toString(),
                address: {
                    governorate: 'central',
                    city: 'deir_albalah',
                    detailedAddress: 'شارع الشهداء بجوار المسجد',
                },
            },
        },
    };
    const errorsMissing = await validateMock(reqMissingGps);
    const hasGpsError = errorsMissing.array().some((e) => e.path.includes('coordinates'));
    if (hasGpsError) {
        console.log('✔ [PASS] رفض طلب تسجيل المتجر بدون GPS إلزامي بنجاح');
    } else {
        throw new Error('فشل فحص GPS الإلزامي - تم قبوله بدون إحداثيات!');
    }

    // B: GPS outside Gaza
    const reqOutsideGaza = {
        body: {
            user: { name: 'تاجر تجريبي', phoneNumber: '0599111222', email: 'test@sadeem.ps', password: 'Password123' },
            store: {
                name: 'متجر بإحداثيات خارج غزة',
                categoryId: sampleCategory._id.toString(),
                address: {
                    governorate: 'central',
                    city: 'deir_albalah',
                    detailedAddress: 'شارع الشهداء بجوار المسجد',
                    coordinates: { lat: 32.500, lng: 35.200 }, // Outside Gaza bounds
                },
            },
        },
    };
    const errorsOutside = await validateMock(reqOutsideGaza);
    const hasBoundsError = errorsOutside.array().some((e) => e.path.includes('coordinates'));
    if (hasBoundsError) {
        console.log('✔ [PASS] رفض إحداثيات خارج قطاع غزة بنجاح');
    } else {
        throw new Error('فشل فحص حدود غزة - تم قبول إحداثية خارج القطاع!');
    }

    // C: Valid GPS inside Central Gaza
    const reqValid = {
        body: {
            user: { name: 'تاجر تجريبي', phoneNumber: '0599111222', email: 'test@sadeem.ps', password: 'Password123' },
            store: {
                name: 'متجر سَدِيم الموثق للأزياء',
                categoryId: sampleCategory._id.toString(),
                address: {
                    governorate: 'central',
                    city: 'deir_albalah',
                    detailedAddress: 'شارع النخيل بجوار البلدية',
                    coordinates: { lat: 31.4185, lng: 34.3514 },
                },
            },
        },
    };
    const errorsValid = await validateMock(reqValid);
    if (errorsValid.isEmpty()) {
        console.log('✔ [PASS] قبول إحداثيات المتجر الصحيحة داخل الوسطى (31.4185, 34.3514)');
    } else {
        console.error('Validation Errors:', errorsValid.array());
        throw new Error('تم رفض إحداثيات صالحة داخل الوسطى!');
    }

    // D: GPS inside Gaza City (should be rejected because only central is allowed for stores)
    const reqGazaCity = {
        body: {
            user: { name: 'تاجر تجريبي', phoneNumber: '0599111222', email: 'test@sadeem.ps', password: 'Password123' },
            store: {
                name: 'متجر في مدينة غزة',
                categoryId: sampleCategory._id.toString(),
                address: {
                    governorate: 'central',
                    city: 'deir_albalah',
                    detailedAddress: 'شارع عمر المختار',
                    coordinates: { lat: 31.505, lng: 34.463 }, // Gaza City coordinates!
                },
            },
        },
    };
    const errorsGazaCity = await validateMock(reqGazaCity);
    const hasSpatialError = errorsGazaCity.array().some((e) => e.msg.includes('المحافظة الوسطى') || e.path.includes('coordinates'));
    if (hasSpatialError) {
        console.log('✔ [PASS] رفض إحداثيات في مدينة غزة بنجاح (فحص مكاني دقيق)');
    } else {
        throw new Error('فشل الفحص المكاني - تم قبول إحداثيات تقع في مدينة غزة!');
    }

    // 4. Persistence Test in MongoDB
    const testEmail = `seller_gps_${Date.now()}@sadeem.ps`;
    const testUser = await User.create({
        name: 'تاجر فحص الـ GPS',
        phoneNumber: '0599111222',
        email: testEmail,
        password: 'hashed_password_test',
        role: 'seller',
        status: 'active',
    });

    const testStore = await Store.create({
        ownerId: testUser._id,
        categoryId: sampleCategory._id,
        name: 'متجر سَدِيم للتحقق الميداني',
        address: {
            governorate: 'central',
            city: 'deir_albalah',
            detailedAddress: 'شارع البحر، دير البلح',
            coordinates: {
                lat: 31.4185,
                lng: 34.3514,
            },
        },
        approveStatus: 'pending',
        status: 'active',
    });

    const savedStore = await Store.findById(testStore._id).lean();
    if (
        savedStore &&
        savedStore.address &&
        savedStore.address.coordinates &&
        savedStore.address.coordinates.lat === 31.4185 &&
        savedStore.address.coordinates.lng === 34.3514
    ) {
        console.log('✔ [PASS] حفظ إحداثيات المتجر في MongoDB بنجاح:', savedStore.address.coordinates);
    } else {
        throw new Error('فشل تخزين إحداثيات المتجر بدقة في قاعدة البيانات!');
    }

    // Cleanup
    await Store.findByIdAndDelete(testStore._id);
    await User.findByIdAndDelete(testUser._id);

    console.log('\n✨ جميع اختبارات تسجيل التاجر والـ GPS والداتا بيز اجتازت بنجاح 100%!\n');
    await mongoose.disconnect();
}

runStoreRegistrationVerification().catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
});
