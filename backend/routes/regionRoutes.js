const express = require('express');
const {
    getAllRegions,
    getAllRegionsForAdmin,
    getRegionById,
    getRegionByIdForAdmin,
    createRegion,
    addCity,
    updateRegionStatus,
    updateRegionCenter,
    updateCityCenter,
} = require('../controllers/regionController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');
const {
    validateRegionScope,
    validateRegionId,
    validateCreateRegion,
    validateCreateCity,
    validateRegionStatus,
    validateRegionCenter,
    validateCityCenter,
} = require('../schemas/regionSchema');

const router = express.Router();
const adminOnly = [authenticate, authorize(ROLE.ADMIN)];

router.get('/admin/regions', ...adminOnly, getAllRegionsForAdmin);
router.get('/admin/regions/:id', ...adminOnly, validateRegionId, getRegionByIdForAdmin);
router.post('/', ...adminOnly, validateCreateRegion, createRegion);
router.post('/:id/cities', ...adminOnly, validateCreateCity, addCity);

router.get('/', validateRegionScope, getAllRegions);
router.get('/:id', validateRegionId, getRegionById);

router.patch(
    '/:id/status',
    ...adminOnly,
    validateRegionId,
    validateRegionStatus,
    updateRegionStatus
);
router.patch(
    '/:id/center',
    ...adminOnly,
    validateRegionCenter,
    updateRegionCenter
);
router.patch(
    '/:id/cities/:cityId/center',
    ...adminOnly,
    validateCityCenter,
    updateCityCenter
);

module.exports = router;
