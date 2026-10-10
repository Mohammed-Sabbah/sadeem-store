const router = require('express').Router();
const {
    createProduct,
    getProducts,
    getSellerProducts,
    getProductById,
    getAdminProducts,
    getAdminProductById,
    updateProduct,
    deleteProduct,
    updateProductAvailability,
    updateProductStatus,
} = require('../controllers/productController');
const { authenticate, authorize, verifyActiveStore } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');
const {
    validateProduct,
    validateProductUpdate,
    validateProductId,
    validateProductFilters,
    validateProductAvailability,
    validateAdminProductStatus,
} = require('../schemas/productSchema');
const { validateVariant, validateVariantUpdate } = require('../schemas/variantSchema');

router.get('/admin', authenticate, authorize(ROLE.ADMIN), validateProductFilters, getAdminProducts);
router.get('/admin/:id', authenticate, authorize(ROLE.ADMIN), validateProductId, getAdminProductById);
router.get('/mine', authenticate, authorize(ROLE.SELLER), validateProductFilters, getSellerProducts);
router.get('/merchant/my-products', authenticate, authorize(ROLE.SELLER), validateProductFilters, getSellerProducts);
router.get('/', validateProductFilters, getProducts);
router.get('/:id', validateProductId, getProductById);

router.post(
    '/',
    authenticate,
    authorize(ROLE.SELLER),
    verifyActiveStore,
    validateProduct,
    validateVariant,
    createProduct
);
router.patch(
    '/:id/approve-status',
    authenticate,
    authorize(ROLE.ADMIN),
    validateProductId,
    validateAdminProductStatus,
    updateProductStatus
);
router.patch(
    '/:id/status',
    authenticate,
    authorize(ROLE.SELLER),
    verifyActiveStore,
    validateProductId,
    validateProductAvailability,
    updateProductAvailability
);
router.patch(
    '/:id/toggle',
    authenticate,
    authorize(ROLE.SELLER),
    verifyActiveStore,
    validateProductId,
    validateProductAvailability,
    updateProductAvailability
);
router.patch(
    '/:id',
    authenticate,
    authorize(ROLE.SELLER),
    verifyActiveStore,
    validateProductId,
    validateProductUpdate,
    validateVariantUpdate,
    updateProduct
);
router.delete(
    '/:id',
    authenticate,
    authorize(ROLE.SELLER),
    verifyActiveStore,
    validateProductId,
    deleteProduct
);

module.exports = router;
