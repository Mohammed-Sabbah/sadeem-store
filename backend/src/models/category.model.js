const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'يرجى كتابة اسم التصنيف'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'يرجى إدخال الرابط التعريفي للتصنيف (Slug)'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    topCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null, // null means it's a top-level parent category
    },
    icon: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for subcategories
categorySchema.virtual('subCategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'topCategoryId',
});

categorySchema.set('toObject', { virtuals: true });
categorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Category', categorySchema);
