const mongoose = require("mongoose")
const {
    STATUS,
    STATUS_VALUES,
    ORDER_STATUS,
    ORDER_STATUS_VALUES,
    PAYMENT_STATUS_VALUES,
    PAYMENT_STATUS
} = require("../constants/enums")
// const { addressSchema } = require("./address")

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
        status: {
            type: String,
            enum: STATUS_VALUES,
            default: STATUS.ACTIVE
        },

        cancellationReason: String,
        cancelledAt: Date,
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { _id: false }
)

const orderSchema = new mongoose.Schema({
    orderGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderGroup",
        required: true,
        index: true
    },
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
    },
    deliveryPhone: {
        type: String,
        required: true,
        trim: true,
    },
    driverAssignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DriverAssignment",
        default: null,
        index: true,
    },
    regionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Region",
        required: true,
        index: true,
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0,
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
        default: ORDER_STATUS.PENDING,
        index: true,
    },
    cancelledBy: {
        type: String,
        default: null
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