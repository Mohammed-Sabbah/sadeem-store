const express = require('express');
const { ROLE } = require('../constants/enums');
const { authenticate, authorize, verifyActiveStore } = require('../middleware/auth');

const upload = require("../middleware/upload")
const uploadToCloudinary = require("../middleware/uploadToCloudinary")

const {
    createVariants,
    updateVariants,
    updateVariantsApproval,
    deleteVariants,
} = require('../controllers/variantController');

const { validateProductId } = require('../schemas/productSchema');

const {
    validateVariantBatchIds,
    validateCreateVariant,
    validateVariantApproval,
    validateVariantPatch,
} = require('../schemas/variantSchema');

const router = express.Router({ mergeParams: true });
const sellerOnly = [authenticate, authorize(ROLE.SELLER), verifyActiveStore];
const adminOnly = [authenticate, authorize(ROLE.ADMIN)];

const imageFolder = "variants"

// Create Variants
router.post('/',
    ...sellerOnly,
    validateProductId,
    upload.array("image", 8),
    validateCreateVariant,
    uploadToCloudinary(imageFolder),
    createVariants
);

// Update variants
router.patch('/',
    ...sellerOnly,
    validateProductId,
    upload.array("image", 8),
    validateVariantPatch,
    uploadToCloudinary(imageFolder),
    updateVariants
);

// Update Variants Approval
router.patch(
    '/approval',
    ...adminOnly,
    validateProductId,
    validateVariantApproval,
    updateVariantsApproval
);

// Delete Variants
router.delete('/', ...sellerOnly, validateProductId, validateVariantBatchIds, deleteVariants);

module.exports = router;
