const mongoose = require('mongoose');
const { ROLE, STATUS } = require('../constants/enums');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        phoneNumber: {
            type: String,
        },
        email: {
            type: String,
            unique: true,
            index: true,
        },
        password: {
            type: String,
            select: false,
        },
        addresses: [
            {
                governorate: { type: String, default: 'central' },
                city: { type: String, default: 'deir_albalah' },
                detailedAddress: { type: String, default: '' },
                coordinates: {
                    lat: { type: Number },
                    lng: { type: Number },
                },
                isDefault: { type: Boolean, default: false },
            },
        ],
        role: {
            type: String,
            enum: Object.values(ROLE),
            default: ROLE.USER,
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

userSchema.methods.toSafeObject = function toSafeObject() {
    const obj = this.toObject();

    delete obj.password;

    return obj;
};

module.exports = mongoose.model('User', userSchema);
