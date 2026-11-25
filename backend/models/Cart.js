const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    quantity: { type: Number, required: true, min: 1, max: 1000, validate: Number.isInteger },
    price: { type: Number, min: 0 },
    knownPrice: { type: Number, min: 0.01, validate: Number.isFinite },
    title: { type: String, maxlength: 160 },
}, { _id: false });

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    revision: { type: Number, default: 0, min: 0 },
    items: { type: [cartItemSchema], default: [] },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Cart', cartSchema);
