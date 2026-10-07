const mongoose = require('mongoose');

const citySchema = new mongoose.Schema(
    {
        id: { type: String },
        name: { type: String },
        center: {
            lat: { type: Number },
            lng: { type: Number },
        },
    },
    { _id: false }
);

const regionSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            unique: true,
            index: true,
        },
        name: {
            type: String,
        },
        status: {
            type: String,
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
            lat: { type: Number },
            lng: { type: Number },
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
