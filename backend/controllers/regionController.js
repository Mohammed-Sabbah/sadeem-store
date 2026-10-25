const Region = require('../models/Region');
const { GAZA_REGIONS } = require('../constants/gaza-regions');
const { success, error } = require('../utils/responses');

/**
 * مزامنة وغرس المحافظات الخمس في MongoDB بحالاتها الثلاث
 */
async function ensureRegionsSeeded() {
    const count = await Region.countDocuments();
    const orderMap = { central: 1, khan_younis: 2, gaza: 3, north: 4, rafah: 5 };

    if (count === 0) {
        const docs = Object.values(GAZA_REGIONS).map((reg) => ({
            code: reg.id,
            name: reg.name,
            status: reg.status,
            isActive: reg.status !== 'closed',
            center: reg.center,
            cities: reg.cities,
            order: orderMap[reg.id] || 99,
        }));
        await Region.insertMany(docs);
    } else {
        // تحديث الحالات إذا كانت المستندات القديمة لا تملك status
        for (const reg of Object.values(GAZA_REGIONS)) {
            await Region.updateOne(
                { code: reg.id },
                {
                    $set: {
                        status: reg.status,
                        isActive: reg.status !== 'closed',
                        order: orderMap[reg.id] || 99,
                    },
                }
            );
        }
    }
}

/**
 * جلب جميع المحافظات بنظام الفلترة حسب نطاق العمل
 * ?scope=hub ➔ المحافظات المتاحة للمتاجر فقط (status === 'hub')
 * ?scope=delivery ➔ المحافظات المتاحة لتوصيل الزبائن (status !== 'closed')
 * بدون scope ➔ جلب كامل المحافظات بحالاتها
 */
async function getAllRegions(req, res, next) {
    try {
        await ensureRegionsSeeded();

        const { scope } = req.query;
        const filter = {};

        if (scope === 'hub' || scope === 'merchant') {
            filter.status = 'hub';
        } else if (scope === 'delivery' || scope === 'customer') {
            filter.status = { $ne: 'closed' };
        }

        const regions = await Region.find(filter).sort({ order: 1 }).lean();

        // خرائط الكود لتسهيل الوصول المباشر
        const regionsMap = {};
        regions.forEach((r) => {
            regionsMap[r.code] = {
                id: r.code,
                name: r.name,
                status: r.status,
                isActive: r.status !== 'closed',
                isHub: r.status === 'hub',
                isDeliveryAllowed: r.status !== 'closed',
                center: r.center,
                cities: r.cities,
            };
        });

        return success(res, 200, {
            count: regions.length,
            regions: regionsMap,
            list: regions,
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * جلب بيانات محافظة محددة بالكود
 */
async function getRegionByCode(req, res, next) {
    try {
        const { code } = req.params;
        const region = await Region.findOne({ code: code.toLowerCase() }).lean();

        if (!region) {
            return error(res, 404, 'المحافظة غير موجودة');
        }

        return success(res, 200, {
            region,
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * تعديل الحالة التشغيلية للمحافظة (لوحة تحكم الأدمن)
 * status: 'closed' | 'delivery_only' | 'hub'
 */
async function updateRegionStatus(req, res, next) {
    try {
        const { code } = req.params;
        const { status } = req.body;

        const updated = await Region.findOneAndUpdate(
            { code: code.toLowerCase() },
            {
                $set: {
                    status,
                    isActive: status !== 'closed',
                },
            },
            { new: true }
        ).lean();

        if (!updated) {
            return error(res, 404, 'المحافظة غير موجودة');
        }

        return success(res, 200, {
            message: `تم تحديث حالة المحافظة بنجاح إلى: ${status}`,
            region: updated,
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    ensureRegionsSeeded,
    getAllRegions,
    getRegionByCode,
    updateRegionStatus,
};
