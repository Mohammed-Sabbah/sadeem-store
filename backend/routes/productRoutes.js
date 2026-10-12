const express = require('express');
const { ROLE } = require('../constants/enums');

// Middlewares 
const { authenticate, authorize, verifyActiveStore } = require('../middleware/auth');
const sellerOnly = [authenticate, authorize(ROLE.SELLER), verifyActiveStore];
const adminOnly = [authenticate, authorize(ROLE.ADMIN)];

// Controllers
const {
    getPublicProducts,
    getPublicProduct,
    getSellerProducts,
    getAdminProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    addVariant,
    updateVariant,
    deleteVariant,
    updateProductStatus,
    updateVariantStatus,
    updateProductApproval,
    updateVariantApproval,
} = require('../controllers/productController');

// Validators
const {
    validateProductId,
    validatePublicProductQuery,
    validateCreateProduct,
    validateUpdateProduct,
    validateProductStatus,
    validateProductApproval,
} = require('../schemas/productSchema');

const {
    validateVariantIds,
    validateCreateVariant,
    validateVariantApproval,
    validateVariantPatch
} = require('../schemas/variantSchema');

const router = express.Router();

// Product routes

// Get All Products - Active and Approved
router.get('/', validatePublicProductQuery, getPublicProducts);

// Get Seller Products 
router.get('/seller', ...sellerOnly, getSellerProducts);

// Get All Products For Admin
router.get('/admin', ...adminOnly, getAdminProducts);



// Create Product
router.post('/', ...sellerOnly, validateCreateProduct, createProduct);

// Get Public Product - Active and Approved
router.get('/:id', validateProductId, getPublicProduct);

// Update Product - Seller
router.patch('/:id', ...sellerOnly, validateProductId, validateUpdateProduct, updateProduct);

// Change Product Approve Status - Admin
router.patch(
    '/admin/:id/approval',
    ...adminOnly,
    validateProductId,
    validateProductApproval,
    updateProductApproval
);

// Change Product Status - Seller
router.patch('/:id/status', ...sellerOnly, validateProductId, validateProductStatus, updateProductStatus);

// Variant Routes

// Create Product Variant
router.post('/:id/variants', ...sellerOnly, validateProductId, validateCreateVariant, addVariant);

// Update Variant
router.patch(
    '/:id/variants/:variantId',
    ...sellerOnly,
    validateVariantIds,
    validateVariantPatch,
    updateVariant
);

// Delete Variant - Seller
router.delete(
    '/:id/variants/:variantId',
    ...sellerOnly,
    validateVariantIds,
    deleteVariant
);

// Change Variant Status - Seller
router.patch(
    '/:id/variants/:variantId/status',
    ...sellerOnly,
    validateVariantIds,
    validateProductStatus,
    updateVariantStatus
);

// Change Variant Approve Status - Admin
router.patch(
    '/admin/:id/variants/:variantId/approval',
    ...adminOnly,
    validateVariantIds,
    validateVariantApproval,
    updateVariantApproval
);

// Delete Product - Seller
router.delete('/:id', ...sellerOnly, validateProductId, deleteProduct);

module.exports = router;
