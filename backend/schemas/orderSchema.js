const { body, param, query } = require("express-validator");
const validateRequest = require("./validateRequest");
const { ORDER_STATUS_VALUES, PAYMENT_METHODS_VALUES } = require("../constants/enums")
const { GAZA_REGIONS } = require("../constants/gaza-regions");

// Validate order ID
const validateOrderId = [
    param("id")
        .isMongoId()
        .withMessage("Order ID must be a valid Mongo ID"),

    validateRequest,
];

// Validate order creation
const validateCreateOrder = [
    body().custom((value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            throw new Error("Order data must be an object");
        }

        const allowedFields = [
            "items",
            "deliveryAddress",
            "deliveryPhone",
            "paymentMethod",
            "ownerId",
            "cartRevision",
            "expectedSubtotal"
        ];

        if (Object.keys(value).some((field) => !allowedFields.includes(field))) {
            throw new Error("Order contains unsupported fields");
        }

        return true;
    }),

    // body("ownerId")
    //     .isMongoId()
    //     .withMessage("Cart owner is required"),
    // body("cartRevision")
    //     .isInt({ min: 0 })
    //     .custom(value => typeof value === "number")
    //     .withMessage("Cart revision is required"),
    // body("expectedSubtotal")
    //     .custom(value => typeof value === "number" && Number.isFinite(value) && value >= 0)
    //     .withMessage("Confirmed subtotal is required"),

    body("items")
        .isArray({ min: 1, max: 50 })
        .withMessage("An order must contain between 1 and 50 items"),

    body("items.*")
        .custom((item) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) {
                throw new Error("Each order item must be an object");
            }

            const allowedFields = ["variantId", "quantity"];

            if (Object.keys(item).some((field) => !allowedFields.includes(field))) {
                throw new Error("Order item contains unsupported fields");
            }

            return true;
        }),

    body("items.*.variantId")
        .isMongoId()
        .customSanitizer(value => typeof value === "string" ? value.toLowerCase() : value)
        .withMessage("Variant ID must be a valid Mongo ID"),

    body("items.*.quantity")
        .isInt({ min: 1, max: 1000 })
        .withMessage("Quantity must be a positive whole number")
        .toInt(),

    body("items").custom((items) => {
        if (!Array.isArray(items)) return true;

        const variantIds = items.map((item) => item?.variantId);

        if (variantIds.some((id) => typeof id !== "string")) {
            return true; // Individual validators report invalid IDs.
        }

        if (new Set(variantIds).size !== variantIds.length) {
            throw new Error("Duplicate variants are not allowed in an order");
        }

        return true;
    }),

    body("deliveryAddress")
        .isObject({ strict: true })
        .withMessage("Delivery address must be an address object")
        .bail()
        .custom((address) => {
            const allowedFields = [
                "region",
                "city",
                "detailedAddress",
                "coordinates",
                "isDefault"
            ];
            if (Object.keys(address).some(field => !allowedFields.includes(field))) {
                throw new Error("Delivery address contains unsupported fields");
            }
            if (address.coordinates && Object.keys(address.coordinates).some(
                field => !["lat", "lng"].includes(field)
            )) {
                throw new Error("Delivery coordinates contain unsupported fields");
            }
            return true;
        }),
    body("deliveryAddress.region")
        .notEmpty()
        .isIn(GAZA_REGIONS.map(region => region.id))
        .withMessage("Delivery address region is invalid"),
    body("deliveryAddress.city")
        .notEmpty()
        .custom((city, { req }) => {
            const region = GAZA_REGIONS.find(item => item.id === req.body.deliveryAddress.region);
            return Boolean(region && region.cities.some(item => item.id === city));
        })
        .withMessage("Delivery address city must belong to its region"),
    body("deliveryAddress.detailedAddress")
        .isString()
        .withMessage("Detailed delivery address must be a string")
        .bail()
        .trim()
        .notEmpty()
        .withMessage("Detailed delivery address is required")
        .bail()
        .isLength({ min: 5, max: 500 })
        .withMessage("Detailed delivery address must be between 5 and 500 characters"),
    body("deliveryAddress.coordinates")
        .optional()
        .isObject({ strict: true })
        .withMessage("Delivery address coordinates must be an object"),
    body("deliveryAddress.coordinates.lat")
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage("Delivery address latitude must be valid")
        .toFloat(),
    body("deliveryAddress.coordinates.lng")
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage("Delivery address longitude must be valid")
        .toFloat(),
    body("deliveryAddress.isDefault")
        .optional()
        .isBoolean()
        .withMessage("Delivery address isDefault must be a boolean")
        .toBoolean(),

    body("deliveryPhone")
        .trim()
        .notEmpty()
        .withMessage("Delivery phone is required")
        .bail()
        .matches(/^\+?[0-9\s()-]{8,20}$/)
        .withMessage("Delivery phone number is invalid"),
    body("paymentMethod")
        .isIn(PAYMENT_METHODS_VALUES)
        .withMessage(`Payment method must be one of: ${PAYMENT_METHODS_VALUES.join(", ")}`),
    validateRequest,
];

const validateCalculateOrderTotal = [
    body("items")
        .isArray({ min: 1, max: 50 })
        .withMessage("An order must contain between 1 and 50 items"),
    body("items.*.variantId")
        .isMongoId()
        .customSanitizer(value => typeof value === "string" ? value.toLowerCase() : value)
        .withMessage("Variant ID must be a valid Mongo ID"),
    body("items.*.quantity")
        .isInt({ min: 1, max: 1000 })
        .withMessage("Quantity must be a positive whole number")
        .toInt(),
    body("items").custom((items) => {
        if (!Array.isArray(items)) return true;
        const variantIds = items.map(item => item?.variantId);
        if (variantIds.some(id => typeof id !== "string")) return true;
        if (new Set(variantIds).size !== variantIds.length) {
            throw new Error("Duplicate variants are not allowed in an order");
        }
        return true;
    }),
    body("deliveryAddress")
        .isObject({ strict: true })
        .withMessage("Delivery address must be an address object"),
    body("deliveryAddress.region")
        .notEmpty()
        .isIn(GAZA_REGIONS.map(region => region.id))
        .withMessage("Delivery address region is invalid"),
    body("deliveryAddress.city")
        .notEmpty()
        .custom((city, { req }) => {
            const region = GAZA_REGIONS.find(item => item.id === req.body.deliveryAddress.region);
            return Boolean(region && region.cities.some(item => item.id === city));
        })
        .withMessage("Delivery address city must belong to its region"),
    body("deliveryAddress.coordinates")
        .optional()
        .isObject({ strict: true })
        .withMessage("Delivery address coordinates must be an object"),
    body("deliveryAddress.coordinates.lat")
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage("Delivery address latitude must be valid")
        .toFloat(),
    body("deliveryAddress.coordinates.lng")
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage("Delivery address longitude must be valid")
        .toFloat(),
    validateRequest,
];

// Validate order listing filters
const validateListOrders = [
    query("page")
        .optional()
        .isInt({ min: 1, max: 1000000 })
        .withMessage("Page must be a positive integer")
        .toInt(),

    query("offset")
        .optional()
        .isInt({ min: 0, max: 1000000 })
        .withMessage("Offset must be a non-negative integer")
        .toInt(),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100")
        .toInt(),

    query("search")
        .optional()
        .isString()
        .withMessage("Search must be a string")
        .bail()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Search is too long"),

    query("status")
        .optional()
        .isIn(ORDER_STATUS_VALUES)
        .withMessage("Unsupported order status"),

    query("storeId")
        .optional()
        .isMongoId()
        .withMessage("Store ID must be a valid Mongo ID"),

    query("userId")
        .optional()
        .isMongoId()
        .withMessage("User ID must be a valid Mongo ID"),

    query("buyerId")
        .optional()
        .isMongoId()
        .withMessage("Buyer ID must be a valid Mongo ID"),

    query("orderNumber")
        .optional()
        .isString()
        .withMessage("Order number must be a string")
        .bail()
        .trim()
        .notEmpty()
        .withMessage("Order number cannot be empty")
        .bail()
        .isLength({ max: 100 })
        .withMessage("Order number is too long"),

    query("startDate")
        .optional()
        .isISO8601()
        .withMessage("Start date must be a valid date"),

    query("endDate")
        .optional()
        .isISO8601()
        .withMessage("End date must be a valid date")
        .bail()
        .custom((value, { req }) => {
            const startDate = req.query.startDate || req.query.createdFrom;
            return !startDate || new Date(value) >= new Date(startDate);
        })
        .withMessage("End date must be on or after start date"),

    query("createdFrom")
        .optional()
        .isISO8601()
        .withMessage("Created from must be a valid date"),

    query("createdTo")
        .optional()
        .isISO8601()
        .withMessage("Created to must be a valid date")
        .bail()
        .custom((value, { req }) => {
            const startDate = req.query.startDate || req.query.createdFrom;
            return !startDate || new Date(value) >= new Date(startDate);
        })
        .withMessage("Created to must be on or after created from"),

    query("sortBy")
        .optional()
        .isIn(["createdAt", "updatedAt", "totalAmount"])
        .withMessage("Unsupported order sort field"),

    query("sortOrder")
        .optional()
        .isIn(["asc", "desc"])
        .withMessage("Sort order must be asc or desc"),

    validateRequest,
];

// Validate Update Order Item Status
const validateCancelOrderItemStatus = [
    param("orderId")
        .exists()
        .withMessage("Order ID is required")
        .bail()
        .isMongoId()
        .withMessage("Invalid Order ID"),

    param("itemId")
        .exists()
        .withMessage("Variant ID is required")
        .bail()
        .isMongoId()
        .withMessage("Invalid Variant ID"),
];


module.exports = {
    validateOrderId,
    validateCreateOrder,
    validateCalculateOrderTotal,
    validateListOrders,
    validateCancelOrderItemStatus
};
