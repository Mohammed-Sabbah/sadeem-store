const mongoose = require('mongoose');
const { isValidUnit } = require('../config/units');

const optionValueSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        label: {
            type: String,
            required: true,
            trim: true,
        },
        hex: {
            type: String,
            default: null,
            trim: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { _id: false }
);

const optionDefinitionSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        label: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['COLOR', 'SIZE', 'TEXT', 'NUMERIC'],
            default: 'TEXT',
            required: true,
        },
        unit: {
            type: String,
            default: null,
            trim: true,
            lowercase: true,
            validate: {
                validator: function (v) {
                    if (!v) return true;
                    return isValidUnit(v);
                },
                message: (props) => `${props.value} ليست وحدة قياس معتمدة في النظام`,
            },
        },
        values: {
            type: [optionValueSchema],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

optionDefinitionSchema.index({ isActive: 1, key: 1 });

module.exports = mongoose.model('OptionDefinition', optionDefinitionSchema);
