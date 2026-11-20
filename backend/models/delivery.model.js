const mongoose = require("mongoose")
const { DELIVERY_STATUS_VALUES, DELIVERY_STATUS, DELIVERY_TYPE_VALUES, DELIVERY_TYPE } = require("../constants/enums")

const driverPaymentSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            min: 0,
            default: null
        },
        status: {
            type: String,
            enum: ["PENDING", "PAYABLE", "PAID"],
            default: "PENDING"
        },
        paidAt: {
            type: Date,
            default: null
        }
    },
    { _id: false }
);


const deliverySchema = new mongoose.Schema({
    orderGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderGroup",
        required: true
    },
    ordersIds: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        }],
        required: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    status: {
        type: String,
        enum: DELIVERY_STATUS_VALUES,
        default: DELIVERY_STATUS.INPROGRESS
    },
    pickUpLocations: {
        type: [String],
        required: true
    },
    deliveryLocation: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: DELIVERY_TYPE_VALUES,
        default: DELIVERY_TYPE.COLLECTION,
    },
    driverPayment: {
        type: driverPaymentSchema,
        // required: true
    },
    assignedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    cancellationReason: {
        type: String,
        default: null,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })

const Delivery = new mongoose.model("Delivery", deliverySchema)
module.exports = Delivery