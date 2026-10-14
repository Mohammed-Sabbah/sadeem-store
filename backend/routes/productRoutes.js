const express = require('express');
const { ROLE } = require('../constants/enums');

// Middlewares
const { authenticate, authorize, verifyActiveStore } = require('../middleware/auth');
const sellerOnly = [authenticate, authorize(ROLE.SELLER), verifyActiveStore];
const adminOnly = [authenticate, authorize(ROLE.ADMIN)];

// Controllers
const {
    createProduct,
    getProducts,
    getPublicProducts,
    getSellerProducts,
    getProductById,
    getPublicProduct,
    getAdminProducts,
    getAdminProductById,
    updateProduct,
    deleteProduct,
    updateProductStatus,
    updateProductApproval,
    addVariant,
    updateVariant,
    deleteVariant,
    updateVariantStatus,
    updateVariantApproval,
} = require('../controllers/productController');

// Validators
const {
    validateProduct,
    validateProductUpdate,
    validateProductId,
    validateProductFilters,
    validateProductStatus,
    validateProductApproval,
} = require('../schemas/productSchema');

const {
    validateVariant,
    validateVariantUpdate,
    validateVariantIds,
    validateCreateVariant,
    validateVariantPatch,
    validateVariantApproval,
} = require('../schemas/variantSchema');

const router = express.Router();

// ==========================================
// Admin Routes
// ==========================================
router.get('/admin', ...adminOnly, validateProductFilters, getAdminProducts);
router.get('/admin/:id', ...adminOnly, validateProductId, getAdminProductById);
router.patch('/admin/:id/approval', ...adminOnly, validateProductId, validateProductApproval, updateProductApproval);
router.patch('/:id/approval', ...adminOnly, validateProductId, validateProductApproval, updateProductApproval);
router.patch('/admin/:id/variants/:variantId/approval', ...adminOnly, validateVariantIds, validateVariantApproval, updateVariantApproval);
router.patch('/:id/variants/:variantId/approval', ...adminOnly, validateVariantIds, validateVariantApproval, updateVariantApproval);
router.delete('/admin/:id', ...adminOnly, validateProductId, deleteProduct);

// ==========================================
// Seller Routes (Dashboard & Management)
// ==========================================
router.get('/seller', ...sellerOnly, validateProductFilters, getSellerProducts);
router.get('/mine', ...sellerOnly, validateProductFilters, getSellerProducts);
router.get('/merchant/my-products', ...sellerOnly, validateProductFilters, getSellerProducts);

// Create Product (Batch Matrix or Simple Product)
router.post('/', ...sellerOnly, validateProduct, validateVariant, createProduct);

// Update Product (Batch Matrix or Fields)
router.patch('/:id', ...sellerOnly, validateProductId, validateProductUpdate, validateVariantUpdate, updateProduct);

// Toggle Product Status (Active / InActive)
router.patch('/:id/status', ...sellerOnly, validateProductId, validateProductStatus, updateProductStatus);
router.patch('/:id/toggle', ...sellerOnly, validateProductId, validateProductStatus, updateProductStatus);

// Delete Product (Soft Delete)
router.delete('/:id', ...sellerOnly, validateProductId, deleteProduct);

// ==========================================
// Sub-resource Variant Routes
// ==========================================
router.post('/:id/variants', ...sellerOnly, validateProductId, validateCreateVariant, addVariant);
router.patch('/:id/variants/:variantId', ...sellerOnly, validateVariantIds, validateVariantPatch, updateVariant);
router.delete('/:id/variants/:variantId', ...sellerOnly, validateVariantIds, deleteVariant);
router.patch('/:id/variants/:variantId/status', ...sellerOnly, validateVariantIds, validateProductStatus, updateVariantStatus);

// ==========================================
// Public Storefront Routes
// ==========================================
router.get('/', validateProductFilters, getPublicProducts);
router.get('/:id', validateProductId, getPublicProduct);

module.exports = router;
