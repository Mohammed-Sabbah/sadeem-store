const { STATUS, APPROVE_STATUS } = require("../constants/enums")
const Variant = require("../models/Variant")
const error = require("../utils/error")

const updateVariantStock = async ({ variantId, newStock }, session) => {
    if (!newStock || newStock < 0) throw error("invalid stock value")
    const updatedVariant = await Variant.findOneAndUpdate({
        _id: variantId,
        status: STATUS.ACTIVE,
        approveStatus: APPROVE_STATUS.APPROVED,
        isDeleted: false
    }, {
        $set: {
            stock: newStock
        },
    },
        { session }
    )
    if (!updatedVariant) throw error("Cant update this variant stock")
}

module.exports = {
    updateVariantStock
}