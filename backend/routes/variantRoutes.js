const express = require('express');
const { ROLE } = require('../constants/enums');
const { authenticate, authorize, verifyActiveStore } = require('../middleware/auth');

const upload = require("../middleware/upload")
const uploadToCloudinary = require("../middleware/uploadToCloudinary")

const {
    addVariant,
    updateVariant,
    updateVariantApproval,
    deleteVariant,
} = require('../controllers/variantController');

const { validateProductId } = require('../schemas/productSchema');

const {
    validateVariantIds,
    validateCreateVariant,
    validateVariantApproval,
    validateVariantPatch,
} = require('../schemas/variantSchema');

const router = express.Router({ mergeParams: true });
const sellerOnly = [authenticate, authorize(ROLE.SELLER), verifyActiveStore];
const adminOnly = [authenticate, authorize(ROLE.ADMIN)];

const imageFolder = "variants"
// Create Variant
router.post('/',
    ...sellerOnly,
    validateProductId,
    upload.array("image", 1),
    validateCreateVariant,
    uploadToCloudinary(imageFolder),
    addVariant
);

// Update Variant
router.patch('/:variantId',
    ...sellerOnly,
    validateVariantIds,
    upload.array("image", 1),
    validateVariantPatch,
    uploadToCloudinary(imageFolder),
    updateVariant
);

// Delete Variant
router.delete('/:variantId', ...sellerOnly, validateVariantIds, deleteVariant);

// Update Variant Approval
router.patch(
    '/:variantId/approval',
    ...adminOnly,
    validateVariantIds,
    validateVariantApproval,
    updateVariantApproval
);

module.exports = router;
