const mongoose = require('mongoose');
const { GAZA_REGIONS } = require('../constants/gaza-regions');

const validCities = Object.values(GAZA_REGIONS).flatMap((region) => region.cities.map((city) => city.id));

function createAddressSchema({ detailedAddressRequired = false, coordinatesRequired = false } = {}) {
    return new mongoose.Schema(
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
                        const governorate = this.governorate || this.parent()?.address?.governorate || 'central';
                        const region = GAZA_REGIONS[governorate];
                        return Boolean(region && region.cities.some((regionCity) => regionCity.id === city));
                    },
                    message: 'City must belong to the selected governorate',
                },
            },
            detailedAddress: {
                type: String,
                default: '',
                required: detailedAddressRequired,
            },
            coordinates: {
                lat: {
                    type: Number,
                    min: coordinatesRequired ? 31.18 : undefined,
                    max: coordinatesRequired ? 31.62 : undefined,
                    required: coordinatesRequired,
                },
                lng: {
                    type: Number,
                    min: coordinatesRequired ? 34.15 : undefined,
                    max: coordinatesRequired ? 34.60 : undefined,
                    required: coordinatesRequired,
                },
            },
            isDefault: {
                type: Boolean,
                default: false,
            },
        },
        { _id: false }
    );
}

module.exports = {
    createAddressSchema,
};
