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
    governorate: {
      type: String,
      required: true,
      default: 'المحافظة الوسطى',
      enum: ['المحافظة الوسطى', 'خان يونس', 'رفح', 'غزة', 'شمال غزة'],
    },
    city: {
      type: String,
      required: true,
      enum: ['دير البلح', 'مخيم النصيرات', 'الزوايدة', 'مخيم البريج', 'مخيم المغازي'],
      default: 'دير البلح',
    },
    storeAddress: {
      type: String,
      required: [true, 'يرجى إدخال العنوان التفصيلي (الشارع، معلَم قريب)'],
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    whatsapp: {
      type: String,
      default: '',
      trim: true,
    },
    businessType: {
      type: String,
      enum: ['محل تجاري قائم', 'ورشة حرفية / تصنيع', 'مشروع منزلي'],
      default: 'محل تجاري قائم',
    },
    payoutMethod: {
      type: String,
      enum: ['كاش عند تسليم الطرد', 'محفظة جوال باي (Jawwal Pay)', 'حساب بنك فلسطين / إسلامي'],
      default: 'كاش عند تسليم الطرد',
    },
    pickupTime: {
      type: String,
      default: 'طوال اليوم (9 ص - 7 م)',
    },
    socialLink: {
      type: String,
      default: '',
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
