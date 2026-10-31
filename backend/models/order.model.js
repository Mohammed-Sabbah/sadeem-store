const mongoose = require("mongoose")
const {
    ORDER_STATUS,
    ORDER_STATUS_VALUES,
    PAYMENT_METHODS,
    PAYMENT_METHODS_VALUES,
    PAYMENT_STATUS_VALUES,
    PAYMENT_STATUS
} = require("../constants/enums")

const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Variant",
            required: true,
        },
        productTitle: {
            type: String,
            required: true,
            trim: true,
        },
        variantDetails: {
            type: String,
            default: "",
        },
        image: {
            type: String,
            default: null,
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "Quantity must be an integer",
            },
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
)

const orderSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    items: {
        type: [orderItemSchema],
        required: true
    },
    deliveryAddress: {
        type: String,
        required: true,
        trim: true,
    },
    deliveryPhone: {
        type: String,
        required: true,
        trim: true,
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0,
    },
    deliveryFee: {
        type: Number,
        // required: true,
        min: 0,
        default: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    paymentMethod: {
        type: String,
        enum: PAYMENT_METHODS_VALUES,
        required: true,
        default: PAYMENT_METHODS.WALLET,
    },
    paymentStatus: {
        type: String,
        enum: PAYMENT_STATUS_VALUES,
        required: true,
        default: PAYMENT_STATUS.PAID,
    },
    status: {
        type: String,
        enum: ORDER_STATUS_VALUES,
        required: true,
        default: ORDER_STATUS.CONFIRMED,
        index: true,
    },
    cancellationReason: {
        type: String,
        trim: true,
        default: null,
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
    deliveredAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true })

const Order = new mongoose.model("Order", orderSchema)
module.exports = Order