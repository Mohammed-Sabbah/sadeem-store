const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'يرجى كتابة الاسم الكامل'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'يرجى إدخال البريد الإلكتروني'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'يرجى إدخال بريد إلكتروني صحيح'],
    },
    phone: {
      type: String,
      sparse: true,
      trim: true,
      match: [/^(\+?970|0)?5[96]\d{7}$/, 'يرجى إدخال رقم جوال فلسطيني صالح (059xxxxxxx أو 056xxxxxxx)'],
    },
    password: {
      type: String,
      required: [true, 'يرجى إدخال كلمة المرور'],
      minlength: [6, 'يجب ألا تقل كلمة المرور عن 6 خانات'],
    },
    role: {
      type: String,
      enum: ['customer', 'merchant', 'courier', 'admin'],
      default: 'customer',
    },
    status: {
      type: String,
      enum: ['active', 'pending_approval', 'suspended'],
      default: 'active',
    },
    city: {
      type: String,
      default: 'دير البلح',
      enum: ['دير البلح', 'مخيم النصيرات', 'الزوايدة', 'مخيم البريج', 'مخيم المغازي'],
    },
    address: {
      type: String,
      default: '',
    },
    addresses: [
      {
        label: {
          type: String,
          default: 'البيت',
        },
        governorate: {
          type: String,
          default: 'المحافظة الوسطى',
        },
        city: {
          type: String,
          default: 'دير البلح',
          enum: ['دير البلح', 'مخيم النصيرات', 'الزوايدة', 'مخيم البريج', 'مخيم المغازي'],
        },
        detailedAddress: {
          type: String,
          required: true,
        },
        phone: {
          type: String,
          default: '',
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    walletBalance: {
      type: Number,
      default: 0,
      min: [0, 'لا يمكن أن يكون رصيد المحفظة بالسالب'],
    },
    ordersCount: {
      type: Number,
      default: 0,
    },
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Do not return password by default
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);
