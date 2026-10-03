const Merchant = require('../models/merchant.model');
const User = require('../models/user.model');
const { success, error, serverError } = require('../utils/responses');

/**
 * List all pending merchants (Admin only)
 */
exports.getPendingMerchants = async (req, res) => {
  try {
    const pending = await Merchant.find({ status: 'pending_approval' })
      .populate('ownerId', 'name phone email createdAt')
      .sort({ createdAt: -1 });

    return success(res, 200, { merchants: pending, count: pending.length });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * Approve merchant (Admin only)
 */
exports.approveMerchant = async (req, res) => {
  const { id } = req.params;

  try {
    const merchant = await Merchant.findById(id);
    if (!merchant) {
      return error(res, 404, 'طلب المتجر غير موجود');
    }

    merchant.status = 'active';
    merchant.approvedAt = new Date();
    merchant.approvedBy = req.user._id;
    await merchant.save();

    // Activate the owner's user account so they can now log in
    await User.findByIdAndUpdate(merchant.ownerId, { status: 'active' });

    return success(
      res,
      200,
      { merchant },
      `تم اعتماد متجر «${merchant.storeName}» بنجاح وتفعيل حساب التاجر.`
    );
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * Reject merchant (Admin only)
 */
exports.rejectMerchant = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const merchant = await Merchant.findById(id);
    if (!merchant) {
      return error(res, 404, 'طلب المتجر غير موجود');
    }

    merchant.status = 'rejected';
    merchant.rejectionReason = reason || 'لم يستوفِ الشروط المعتمدة لمنصة سَدِيم';
    await merchant.save();

    await User.findByIdAndUpdate(merchant.ownerId, { status: 'suspended' });

    return success(res, 200, { merchant }, `تم رفض طلب المتجر.`);
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * List verified public merchants (Public directory)
 */
exports.getPublicMerchants = async (req, res) => {
  try {
    const merchants = await Merchant.find({ status: 'active' })
      .select('storeName category city storeAddress createdAt')
      .sort({ createdAt: -1 });

    return success(res, 200, { merchants, count: merchants.length });
  } catch (err) {
    return serverError(res, err);
  }
};
