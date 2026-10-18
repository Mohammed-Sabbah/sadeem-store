const express = require('express');
const {
    getAllRegions,
    getRegionByCode,
    updateRegionStatus,
} = require('../controllers/regionController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');
const {
    validateRegionScope,
    validateRegionCode,
    validateRegionStatus,
} = require('../schemas/regionSchema');

const router = express.Router();

// 1. المسار الموحد العام لجلب المحافظات (مع دعم الفلترة ?scope=hub / ?scope=delivery)
router.get('/', validateRegionScope, getAllRegions);

// 2. جلب تفاصيل محافظة محددة بالكود
router.get('/:code', validateRegionCode, getRegionByCode);

// 3. تعديل الحالة التشغيلية للمحافظة (متاح للأدمن فقط)
router.patch(
    '/:code/status',
    authenticate,
    authorize(ROLE.ADMIN),
    validateRegionStatus,
    updateRegionStatus
);

module.exports = router;
