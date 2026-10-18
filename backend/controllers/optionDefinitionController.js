const OptionDefinition = require('../models/OptionDefinition');
const Category = require('../models/Category');
const { UNITS } = require('../config/units');
const { success, error } = require('../utils/responses');

/**
 * جلب جميع الخيارات المعرفة في النظام (OptionDefinitions)
 */
async function getAllOptionDefinitions(req, res, next) {
    try {
        const definitions = await OptionDefinition.find({ isActive: true })
            .sort({ key: 1 })
            .lean();

        return success(res, 200, {
            definitions,
            availableUnits: UNITS,
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * جلب الخيارات المتاحة لتصنيف محدد (Allowed Options for Category) مع التوريث
 */
async function getOptionsByCategory(req, res, next) {
    try {
        const { categoryId } = req.params;
        const allowedKeys = await Category.resolveAllowedOptions(categoryId);

        let definitions = [];
        if (allowedKeys && allowedKeys.length > 0) {
            definitions = await OptionDefinition.find({
                key: { $in: allowedKeys },
                isActive: true,
            }).lean();
        } else {
            // إن لم يكن محدد، نُرجع الخيارات النشطة الشائعة
            definitions = await OptionDefinition.find({ isActive: true }).lean();
        }

        return success(res, 200, {
            allowedKeys,
            definitions,
            availableUnits: UNITS,
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * إنشاء تعريف خيار جديد (خاص بالأدمن)
 */
async function createOptionDefinition(req, res, next) {
    try {
        const { key, label, type, unit, values } = req.body;

        const cleanKey = String(key || '').trim().toLowerCase();
        if (!cleanKey || !label) {
            return error(res, 400, 'المفتاح والتسمية مطلوبان لتعريف الخيار');
        }

        const existing = await OptionDefinition.findOne({ key: cleanKey });
        if (existing) {
            return error(res, 409, 'هذا الخيار معرف مسبقاً في النظام');
        }

        const definition = await OptionDefinition.create({
            key: cleanKey,
            label: String(label).trim(),
            type: type || 'TEXT',
            unit: unit || null,
            values: Array.isArray(values) ? values : [],
        });

        return success(res, 201, {
            message: 'تم إضافة تعريف الخيار بنجاح',
            definition,
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * إضافة قيمة جديدة لخيار معرف (مثل إضافة لون جديد للأدمن)
 */
async function addValueToOption(req, res, next) {
    try {
        const { key } = req.params;
        const { valueKey, label, hex, sortOrder } = req.body;

        const cleanKey = String(key || '').trim().toLowerCase();
        const definition = await OptionDefinition.findOne({ key: cleanKey });
        if (!definition) {
            return error(res, 404, 'الخيار غير موجود');
        }

        const valKey = String(valueKey || '').trim().toLowerCase();
        if (definition.values.some((v) => v.key === valKey)) {
            return error(res, 409, 'هذه القيمة موجودة مسبقاً في هذا الخيار');
        }

        definition.values.push({
            key: valKey,
            label: String(label || valKey).trim(),
            hex: hex || null,
            sortOrder: Number(sortOrder) || 0,
            isActive: true,
        });

        await definition.save();

        return success(res, 200, {
            message: 'تم إضافة القيمة للخيار بنجاح',
            definition,
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getAllOptionDefinitions,
    getOptionsByCategory,
    createOptionDefinition,
    addValueToOption,
};
