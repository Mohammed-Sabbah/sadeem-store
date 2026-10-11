const mongoose = require('mongoose');

const variantAttributeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        values: {
            type: [String],
            required: true,
            default: [],
        },
    },
    { _id: false }
);

const categorySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        variantAttributes: {
            type: [variantAttributeSchema],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

module.exports = mongoose.model('Category', categorySchema);
