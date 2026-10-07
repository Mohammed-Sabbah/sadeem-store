const mongoose = require('mongoose');

const citySchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        name: { type: String, required: true },
        center: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
    },
    { _id: false }
);

const regionSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['closed', 'delivery_only', 'hub'],
            default: 'closed',
            index: true,
        },
        isActive: {
            type: Boolean,
            default: function () {
                return this.status !== 'closed';
            },
        },
        center: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        cities: [citySchema],
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Virtual helpers
regionSchema.virtual('isHub').get(function () {
    return this.status === 'hub';
});

regionSchema.virtual('isDeliveryAllowed').get(function () {
    return this.status !== 'closed';
});

module.exports = mongoose.model('Region', regionSchema);
