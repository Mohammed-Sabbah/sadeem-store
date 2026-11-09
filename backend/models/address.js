const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    governorate: {
        type: String,
        default: 'central',
    },
    city: {
        type: String,
        default: 'deir_albalah',
    },
    detailedAddress: {
        type: String,
        default: '',
    },
    coordinates: {
        lat: {
            type: Number,
        },
        lng: {
            type: Number,
        },
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
},
    { _id: false }
);

module.exports = {
    addressSchema,
};
