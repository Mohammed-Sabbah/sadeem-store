const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    storeName: {
      type: String,
      required: [true, 'يرجى كتابة اسم المتجر'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'يرجى تحديد تصنيف المتجر'],
      enum: [
        'أزياء وملابس',
        'مؤونة وضيافة',
        'طاقة وإلكترونيات',
        'عطور وعناية',
        'حرف وخزف',
        'أغذية ومعجنات',
        'أخرى',
      ],
      default: 'أزياء وملابس',
    },
    city: {
      type: String,
      required: true,
      enum: ['دير البلح', 'مخيم النصيرات', 'الزوايدة', 'مخيم البريج', 'مخيم المغازي'],
      default: 'دير البلح',
    },
    storeAddress: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending_approval', 'active', 'rejected'],
      default: 'pending_approval',
    },
    commissionRate: {
      type: Number,
      default: 0.10, // 10%
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Merchant', merchantSchema);
