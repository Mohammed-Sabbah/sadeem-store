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
        isActive: {
            type: Boolean,
            default: true
        },
        center: {
            lat: { type: Number },
            lng: { type: Number },
        },
        cities: [citySchema],
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

regionSchema.index({ isActive: 1 });

module.exports = mongoose.model('Region', regionSchema);
