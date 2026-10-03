const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'يرجى كتابة الاسم الكامل'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'يرجى إدخال رقم الجوال'],
      unique: true,
      trim: true,
      match: [/^(\+?970|0)?5[96]\d{7}$/, 'يرجى إدخال رقم جوال فلسطيني صالح (059xxxxxxx أو 056xxxxxxx)'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
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
