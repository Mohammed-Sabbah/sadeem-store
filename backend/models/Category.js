const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        title: {
            type: String,
        },
        topCategoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
    },
    {
        versionKey: false,
        timestamps: false,
    }
);

module.exports = mongoose.model('Category', categorySchema);
