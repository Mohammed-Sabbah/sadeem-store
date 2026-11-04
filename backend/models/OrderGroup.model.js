const mongoose = require('mongoose');
const {
    PAYMENT_METHODS_VALUES,
    PAYMENT_STATUS_VALUES,
    PAYMENT_STATUS,
    ORDER_STATUS_VALUES,
    ORDER_STATUS
} = require('../constants/enums');
const { addressSchema } = require('./address');

const orderGroupSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        orders: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Order'
            }
        ],
        deliveryAddress: {
            type: String,
            required: true
        },
        deliveryPhone: {
            type: String,
            required: true,
            trim: true
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },
        deliveryFee: {
            type: Number,
            required: true,
            min: 0
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        paymentMethod: {
            type: String,
            enum: PAYMENT_METHODS_VALUES,
            required: true
        },
        paymentStatus: {
            type: String,
            enum: PAYMENT_STATUS_VALUES,
            default: PAYMENT_STATUS.PAID
        },
        walletTransactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WalletTransaction',
            default: null
        },
        externalPaymentReference: {
            type: String,
            default: null
        },
        status: {
            type: String,
            enum: ORDER_STATUS_VALUES,
            default: ORDER_STATUS.PENDING
        },
        cancelledAt: {
            type: Date,
            default: null
        },
        cancellationReason: {
            type: String,
            default: null,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

orderGroupSchema.index({ userId: 1, createdAt: -1 });
orderGroupSchema.index({ status: 1, createdAt: -1 });
orderGroupSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('OrderGroup', orderGroupSchema);
