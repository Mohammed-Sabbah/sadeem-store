const mongoose = require('mongoose');
const { STATUS } = require('../constants/enums');
const { GAZA_REGIONS } = require('../constants/gaza-regions');

const validCities = Object.values(GAZA_REGIONS).flatMap((region) => region.cities.map((city) => city.id));
const addressSchema = new mongoose.Schema(
    {
        governorate: {
            type: String,
            enum: Object.keys(GAZA_REGIONS),
            default: 'central',
        },
        city: {
            type: String,
            enum: validCities,
            default: 'deir_albalah',
            validate: {
                validator(city) {
                    const address = this.address || this.parent()?.address;
                    const region = address && GAZA_REGIONS[address.governorate];
                    return Boolean(region && region.cities.some((regionCity) => regionCity.id === city));
                },
                message: 'City must belong to the selected governorate',
            },
        },
        detailedAddress: {
            type: String,
            default: '',
            reqyuired: true,
        },
        coordinates: {
            lat: { type: Number, min: -90, max: 90 },
            lng: { type: Number, min: -180, max: 180 },
            required: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
);

const storeSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            unique: true,
            index: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
        },
        name: {
            type: String,
        },
        logo: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            default: '',
        },
        address: { type: addressSchema, default: () => ({}) },
        balance: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: Object.values(STATUS),
            default: STATUS.ACTIVE,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

module.exports = mongoose.model('Store', storeSchema);
