const express = require('express');
const {
    getAllRegions,
    getRegionByCode,
    updateRegionStatus,
} = require('../controllers/regionController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');

const router = express.Router();

// 1. المسار الموحد العام لجلب المحافظات (مع دعم الفلترة ?scope=hub / ?scope=delivery)
router.get('/', getAllRegions);

// 2. جلب تفاصيل محافظة محددة بالكود
router.get('/:code', getRegionByCode);

// 3. تعديل الحالة التشغيلية للمحافظة (متاح للأدمن فقط)
router.patch('/:code/status', authenticate, authorize(ROLE.ADMIN), updateRegionStatus);

module.exports = router;
