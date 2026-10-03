const Category = require('../models/category.model');
const { success, error, serverError } = require('../utils/responses');

// Initial Central Gaza Categories Seed Data
const defaultCategories = [
  {
    title: 'أزياء وملابس',
    slug: 'fashion',
    description: 'أزياء شرقية وعصرية، عبايات، وشالات فاخرة من متاجر الوسطى',
    icon: 'sparkles',
    order: 1,
  },
  {
    title: 'مؤونة وضيافة',
    slug: 'pantry',
    description: 'زيوت زيتون بلدية معصورة على البارد، عسل سدر طبيعي، ومكسرات طازجة',
    icon: 'leaf',
    order: 2,
  },
  {
    title: 'طاقة وإلكترونيات',
    slug: 'power-electronics',
    description: 'بطاريات طوارئ ليثيوم، إنارة ذكية، ألواح شمسية وبدائل موثوقة في غزة',
    icon: 'zap',
    order: 3,
  },
  {
    title: 'عطور وعناية',
    slug: 'beauty-perfumes',
    description: 'عطور فاخرة، زيوت عطرية، وصابون غار وعناية طبيعية مصنوعة يدوياً',
    icon: 'heart',
    order: 4,
  },
  {
    title: 'حرف وخزف',
    slug: 'crafts',
    description: 'فخار يدوي عريق، مطرزات فلسطينية أصيلة، ومشغولات خشبية وتحف',
    icon: 'feather',
    order: 5,
  },
  {
    title: 'أغذية ومعجنات',
    slug: 'food-pastries',
    description: 'معجنات طازجة وحلويات ومخبوزات تعد يومياً من مطابخ الوسطى المعتمدة',
    icon: 'coffee',
    order: 6,
  },
];

/**
 * 1. Get All Categories (with subcategories)
 */
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true, topCategoryId: null })
      .sort({ order: 1, createdAt: 1 })
      .populate('subCategories');

    return success(res, 200, { categories }, 'تم جلب التصنيفات بنجاح');
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * 2. Seed Default Categories (Idempotent)
 */
exports.seedDefaultCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(defaultCategories);
      console.log('[Database Seed] 6 default categories seeded successfully for Central Gaza.');
    }
  } catch (err) {
    console.error('[Category Seed Error]:', err.message);
  }
};
