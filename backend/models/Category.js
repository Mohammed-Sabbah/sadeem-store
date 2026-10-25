const mongoose = require('mongoose');
const { ATTRIBUTE_VALUE_TYPE, ATTRIBUTE_VALUE_TYPE_VALUES } = require('../constants/enums');

const variantAttributeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        key: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ATTRIBUTE_VALUE_TYPE_VALUES,
            default: ATTRIBUTE_VALUE_TYPE.STRING,
        },
    },
    { _id: false }
);

const categorySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
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
