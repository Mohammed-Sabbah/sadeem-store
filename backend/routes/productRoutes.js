const express = require('express');
const { ROLE } = require('../constants/enums');

// Middlewares 
const { authenticate, authorize, verifyActiveStore } = require('../middleware/auth');
const sellerOnly = [authenticate, authorize(ROLE.SELLER), verifyActiveStore];
const adminOnly = [authenticate, authorize(ROLE.ADMIN)];
const upload = require("../middleware/upload")
const uploadToCloudinary = require("../middleware/uploadToCloudinary")

// Controllers
const {
    getPublicProducts,
    getPublicProduct,
    getSellerProducts,
    getAdminProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStatus,
    updateProductApproval,
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

const router = express.Router();
const imageFolder = "products"

// Product routes

// Get All Products - Active and Approved
router.get('/', validatePublicProductQuery, getPublicProducts);

// Get Seller Products 
router.get('/seller', ...sellerOnly, getSellerProducts);

// Get All Products For Admin
router.get('/admin', ...adminOnly, getAdminProducts);



// Create Product
router.post('/',
    ...sellerOnly,
    upload.array("images", 5),
    validateCreateProduct,
    uploadToCloudinary(imageFolder),
    createProduct);

// Get Public Product - Active and Approved
router.get('/:id', validateProductId, getPublicProduct);

// Update Product - Seller
router.patch('/:id',
    ...sellerOnly,
    validateProductId,
    upload.array("images", 5),
    validateUpdateProduct,
    uploadToCloudinary(imageFolder),
    updateProduct
);

// Change Product Approve Status - Admin
router.patch(
    '/:id/approval',
    ...adminOnly,
    validateProductId,
    validateProductApproval,
    updateProductApproval
);

// Change Product Status - Seller
router.patch('/:id/status', ...sellerOnly, validateProductId, validateProductStatus, updateProductStatus);

// Delete Product - Seller
router.delete('/:id', ...sellerOnly, validateProductId, deleteProduct);

module.exports = router;
