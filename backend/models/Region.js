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
        isActive: {
            type: Boolean,
            default: true,
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

module.exports = mongoose.model('Region', regionSchema);
