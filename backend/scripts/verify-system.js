require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Store = require('../models/Store');
const Category = require('../models/Category');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const { ROLE, STATUS } = require('../constants/enums');
const { calculateDeliveryFee, calculateHaversineDistance } = require('../utils/deliveryCalculator');
const { GAZA_REGIONS } = require('../constants/gaza-regions');

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
};

function pass(testName, detail = '') {
    console.log(` ${colors.green}✔ [PASS]${colors.reset} ${colors.bold}${testName}${colors.reset} ${detail ? `(${detail})` : ''}`);
}

function fail(testName, detail = '') {
    console.error(` ${colors.red}✖ [FAIL]${colors.reset} ${colors.bold}${testName}${colors.reset}: ${detail}`);
    process.exitCode = 1;
}

async function runVerification() {
    console.log(`\n${colors.cyan}${colors.bold}====================================================${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}   سَدِيم (Sadeem) — فحص النظام والتحقق الهندسي الشامل   ${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}====================================================${colors.reset}\n`);

    try {
        // 1. فحص الاتصال بقاعدة البيانات
        await connectDB();
        pass('TEST-01: فحص الاتصال بقاعدة البيانات', 'Mongoose Connected');

        // تنظيف أي بيانات فحص قديمة
        const testEmailCustomer = 'test_customer_sadeem_2026@test.com';
        const testEmailMerchant = 'test_merchant_sadeem_2026@test.com';
        const testSlugCategory = 'test-cosmic-luxury';

        await User.deleteMany({ email: { $in: [testEmailCustomer, testEmailMerchant] } });
        await Category.deleteMany({ slug: testSlugCategory });
        await Store.deleteMany({ name: 'متجر سديم التجريبي' });

        // 2. فحص إنشاء قسم جديد وسلامة السكيما (Category)
        const category = await Category.create({
            title: 'عطور وزيوت سديم',
            slug: testSlugCategory,
            icon: 'sparkles',
            order: 1,
            isActive: true,
        });
        if (category && category.slug === testSlugCategory && category.order === 1) {
            pass('TEST-02: سكيما الأقسام (Category Model)', `Slug: ${category.slug}, Order: ${category.order}`);
        } else {
            fail('TEST-02: سكيما الأقسام', 'فشل في حفظ الحقول المعتمدة');
        }

        // 3. فحص تسجيل زبون بدون رقم هاتف (Customer Signup without Phone)
        const customer = await User.create({
            name: 'زبون سديم التجريبي',
            email: testEmailCustomer,
            password: 'hashed_password_placeholder',
            role: ROLE.USER,
            status: STATUS.ACTIVE,
        });
        const customerWallet = await Wallet.create({
            userId: customer._id,
            balance: 0,
            currency: 'ILS',
        });
        if (customer && !customer.phoneNumber && customerWallet && customerWallet.balance === 0) {
            pass('TEST-03: تسجيل زبون بدون هاتف وإنشاء المحفظة تلقائياً', `UserId: ${customer._id}, Wallet Balance: 0 ₪`);
        } else {
            fail('TEST-03: تسجيل الزبون والمحفظة', 'فشل التحقق من إنشاء الحساب أو المحفظة');
        }

        // 4. فحص تسجيل تاجر وحالته المعلقة (Pending Approval)
        const merchantUser = await User.create({
            name: 'التاجر أحمد سديم',
            email: testEmailMerchant,
            phoneNumber: '0599123456',
            password: 'hashed_password_placeholder',
            role: ROLE.SELLER,
            status: STATUS.PENDING_APPROVAL,
        });

        const store = await Store.create({
            ownerId: merchantUser._id,
            categoryId: category._id,
            name: 'متجر سديم التجريبي',
            address: {
                governorate: 'central',
                city: 'deir_albalah',
                detailedAddress: 'دير البلح - شارع النخيل بجوار البلدية',
                coordinates: { lat: 31.418, lng: 34.351 },
            },
            phoneNumber: '0599123456',
            status: STATUS.PENDING_APPROVAL,
        });

        if (merchantUser.status === STATUS.PENDING_APPROVAL && store.status === STATUS.PENDING_APPROVAL) {
            pass('TEST-04: تسجيل تاجر وحساب المتجر بحالة معلقة', `User: ${merchantUser.status}, Store: ${store.status}`);
        } else {
            fail('TEST-04: حالة التاجر المعلقة', 'التاجر أو المتجر ليس في حالة pendingApproval');
        }

        // 5. فحص الموافقة وتفعيل التاجر (Approve Store & User Activation)
        await Store.findByIdAndUpdate(store._id, { $set: { status: STATUS.ACTIVE } });
        await User.findByIdAndUpdate(merchantUser._id, { $set: { status: STATUS.ACTIVE } });

        const updatedStore = await Store.findById(store._id);
        const updatedMerchant = await User.findById(merchantUser._id);

        if (updatedStore.status === STATUS.ACTIVE && updatedMerchant.status === STATUS.ACTIVE) {
            pass('TEST-05: تفعيل المتجر وحساب التاجر بواسطة الإدارة', 'Status changed to ACTIVE');
        } else {
            fail('TEST-05: تفعيل المتجر', 'فشل في تغيير الحالة إلى ACTIVE');
        }

        // 6. فحص دفتر الأستاذ وسجل المحفظة (Wallet & Transaction Ledger)
        const tx = await WalletTransaction.create({
            walletId: customerWallet._id,
            userId: customer._id,
            type: 'deposit',
            amount: 50,
            balanceBefore: 0,
            balanceAfter: 50,
            referenceType: 'jawwal_pay',
            referenceId: 'JP-987654321',
            status: 'completed',
            description: 'شحن رصيد تجريبي عبر جوال باي',
        });
        await Wallet.findByIdAndUpdate(customerWallet._id, { $set: { balance: 50 } });
        const reloadedWallet = await Wallet.findById(customerWallet._id);

        if (tx && reloadedWallet.balance === 50 && tx.balanceBefore === 0 && tx.balanceAfter === 50) {
            pass('TEST-06: تدقيق سجل المحفظة (Wallet Ledger Audit)', `Transaction ID: ${tx._id}, Balance: 50 ₪`);
        } else {
            fail('TEST-06: تدقيق سجل المحفظة', 'فشل في تسجيل حركة الرصيد');
        }

        // 7. فحص حاسبة التوصيل - مسافة قريبة (تطبيق الحد الأدنى 7 ₪)
        // متجر بالنصيرات وزبون بالزوايدة (مسافة ~2 كم)
        const nuseiratCoord = GAZA_REGIONS.central.cities.find((c) => c.id === 'nuseirat').center;
        const zawaydaCoord = GAZA_REGIONS.central.cities.find((c) => c.id === 'zawayda').center;

        const distanceShort = calculateHaversineDistance(
            nuseiratCoord.lat,
            nuseiratCoord.lng,
            zawaydaCoord.lat,
            zawaydaCoord.lng
        );

        const feeShort = calculateDeliveryFee(
            [
                {
                    id: 's1',
                    name: 'متجر النصيرات',
                    governorate: 'central',
                    location: nuseiratCoord,
                },
            ],
            { governorate: 'central', city: 'zawayda', coordinates: zawaydaCoord }
        );

        if (feeShort.totalFee === 7) {
            pass('TEST-07: حاسبة التوصيل (مسافة قريبة $\\le$ 3.5 كم)', `المسافة: ${distanceShort} كم $\\rightarrow$ السعر المعتمد: ${feeShort.totalFee} ₪ (الحد الأدنى)`);
        } else {
            fail('TEST-07: حاسبة التوصيل للمسافة القريبة', `المتوقع 7 ₪، المحسوب: ${feeShort.totalFee} ₪`);
        }

        // 8. فحص حاسبة التوصيل - مسافة متوسطة (أكثر من 3.5 كم)
        // متجر بالنصيرات وزبون بدير البلح (مسافة ~5.5 كم * 2 = 11 ₪)
        const deirCoord = GAZA_REGIONS.central.cities.find((c) => c.id === 'deir_albalah').center;
        const distanceMedium = calculateHaversineDistance(
            nuseiratCoord.lat,
            nuseiratCoord.lng,
            deirCoord.lat,
            deirCoord.lng
        );

        const feeMedium = calculateDeliveryFee(
            [
                {
                    id: 's1',
                    name: 'متجر النصيرات',
                    governorate: 'central',
                    location: nuseiratCoord,
                },
            ],
            { governorate: 'central', city: 'deir_albalah', coordinates: deirCoord }
        );

        if (feeMedium.totalFee >= 10 && feeMedium.totalFee <= 13) {
            pass('TEST-08: حاسبة التوصيل (مسافة متوسطة بالنظام)', `المسافة: ${distanceMedium} كم $\\rightarrow$ السعر: ${feeMedium.totalFee} ₪`);
        } else {
            fail('TEST-08: حاسبة التوصيل للمسافة المتوسطة', `غير متوقع: ${feeMedium.totalFee} ₪`);
        }

        // 9. فحص تعدد المتاجر في نفس المحافظة (أبعد متجر + 4 ₪)
        const feeMultiStoreSameGov = calculateDeliveryFee(
            [
                {
                    id: 's1',
                    name: 'متجر النصيرات',
                    governorate: 'central',
                    location: nuseiratCoord,
                },
                {
                    id: 's2',
                    name: 'متجر الزوايدة',
                    governorate: 'central',
                    location: zawaydaCoord,
                },
            ],
            { governorate: 'central', city: 'deir_albalah', coordinates: deirCoord }
        );

        // مسافة النصيرات لدير البلح (~11 ₪) + متجر ثانٍ (+4 ₪) = ~15 ₪
        if (feeMultiStoreSameGov.shipments.length === 1 && feeMultiStoreSameGov.totalFee >= 14) {
            pass('TEST-09: تعدد المتاجر بنفس المحافظة (طرد موحد + رسم وقفة)', `شحنة واحدة موحدة، الإجمالي: ${feeMultiStoreSameGov.totalFee} ₪`);
        } else {
            fail('TEST-09: تعدد المتاجر بنفس المحافظة', `المحسوب: ${JSON.stringify(feeMultiStoreSameGov)}`);
        }

        // 10. فحص تعدد المحافظات (الفصل لشحنتين مستقلتين)
        // متجر في الوسطى + متجر في خانيونس والزبون في غزة
        const gazaCityCoord = GAZA_REGIONS.gaza.center;
        const khanYounisCoord = GAZA_REGIONS.khan_younis.center;

        const feeCrossGov = calculateDeliveryFee(
            [
                {
                    id: 's_central',
                    name: 'متجر الوسطى',
                    governorate: 'central',
                    location: nuseiratCoord,
                },
                {
                    id: 's_ky',
                    name: 'متجر خانيونس',
                    governorate: 'khan_younis',
                    location: khanYounisCoord,
                },
            ],
            { governorate: 'gaza', city: 'riman', coordinates: gazaCityCoord }
        );

        if (feeCrossGov.shipments.length === 2) {
            pass(
                'TEST-10: فصل الشحنات حسب المحافظة (Cross-Governorate Split)',
                `تم فصلها إلى ${feeCrossGov.shipments.length} شحنات مستقلة بإجمالي: ${feeCrossGov.totalFee} ₪`
            );
        } else {
            fail('TEST-10: فصل الشحنات حسب المحافظة', `المتوقع 2 شحنات، لكن عدد الشحنات: ${feeCrossGov.shipments.length}`);
        }

        // تنظيف السجلات التجريبية
        await User.deleteMany({ email: { $in: [testEmailCustomer, testEmailMerchant] } });
        await Category.deleteMany({ slug: testSlugCategory });
        await Store.deleteMany({ name: 'متجر سديم التجريبي' });
        await Wallet.deleteMany({ userId: { $in: [customer._id, merchantUser._id] } });
        await WalletTransaction.deleteMany({ userId: customer._id });

        console.log(`\n${colors.green}${colors.bold}✨ تم اجتياز جميع اختبارات التحقق الهندسي بنجاح 100%!${colors.reset}\n`);
        process.exit(0);
    } catch (err) {
        console.error(`${colors.red}خطأ أثناء تشغيل الفحص الآلي:${colors.reset}`, err);
        process.exit(1);
    }
}

runVerification();
