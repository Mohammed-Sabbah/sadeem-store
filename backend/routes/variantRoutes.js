const express = require('express');
const { ROLE } = require('../constants/enums');
const { authenticate, authorize, verifyActiveStore } = require('../middleware/auth');
const {
    addVariant,
    updateVariant,
    updateVariantStatus,
    updateVariantApproval,
    deleteVariant,
} = require('../controllers/variantController');

const { validateProductId } = require('../schemas/productSchema');

const {
    validateVariantIds,
    validateCreateVariant,
    validateVariantApproval,
    validateVariantPatch,
    validateVariantStatus,
} = require('../schemas/variantSchema');

const router = express.Router({ mergeParams: true });
const sellerOnly = [authenticate, authorize(ROLE.SELLER), verifyActiveStore];
const adminOnly = [authenticate, authorize(ROLE.ADMIN)];

// Create Variant
router.post('/', ...sellerOnly, validateProductId, validateCreateVariant, addVariant);

// Update Variant
router.patch('/:variantId', ...sellerOnly, validateVariantIds, validateVariantPatch, updateVariant);

// Delete Variant
router.delete('/:variantId', ...sellerOnly, validateVariantIds, deleteVariant);

// Update Variant Status and Approval
router.patch(
    '/:variantId/status',
    ...sellerOnly,
    validateVariantIds,
    validateVariantStatus,
    updateVariantStatus
);
router.patch(
    '/:variantId/approval',
    ...adminOnly,
    validateVariantIds,
    validateVariantApproval,
    updateVariantApproval
);

module.exports = router;
