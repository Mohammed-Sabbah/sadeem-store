const { body, param, query } = require("express-validator");
const validateRequest = require("./validateRequest");
const { ORDER_STATUS_VALUES, PAYMENT_METHODS_VALUES } = require("../constants/enums")

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
            "paymentMethod"
        ];

        if (Object.keys(value).some((field) => !allowedFields.includes(field))) {
            throw new Error("Order contains unsupported fields");
        }

        return true;
    }),

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
        .isString()
        .withMessage("Delivery address must be a string")
        .bail()
        .trim()
        .notEmpty()
        .withMessage("Delivery address is required")
        .bail()
        .isLength({ min: 5, max: 500 })
        .withMessage("Delivery address must be between 5 and 500 characters"),

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

// Validate order listing filters
const validateListOrders = [
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

    query("status")
        .optional()
        .isIn(ORDER_STATUS_VALUES)
        .withMessage("Unsupported order status"),

    query("storeId")
        .optional()
        .isMongoId()
        .withMessage("Store ID must be a valid Mongo ID"),

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

    query("createdFrom")
        .optional()
        .isISO8601()
        .withMessage("Created from must be a valid date"),

    query("createdTo")
        .optional()
        .isISO8601()
        .withMessage("Created to must be a valid date")
        .bail()
        .custom((value, { req }) =>
            !req.query.createdFrom ||
            new Date(value) >= new Date(req.query.createdFrom)
        )
        .withMessage("Created to must be on or after created from"),

    validateRequest,
];

module.exports = {
    validateOrderId,
    validateCreateOrder,
    validateListOrders,
};
