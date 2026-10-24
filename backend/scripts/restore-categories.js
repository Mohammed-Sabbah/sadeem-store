require('dotenv').config();
const mongoose = require('mongoose');

const CANONICAL_CATEGORIES = [
  {
    _id: new mongoose.Types.ObjectId('6ad272d11340fa558ca45dca'),
    title: 'ملابس وأزياء',
    slug: 'fashion',
    order: 1,
    isActive: true,
    variantAttributes: [
      {
        name: 'اللون',
        key: 'اللون',
        type: 'String',
        values: [
          'أسود',
          'أبيض',
          'أوف وايت',
          'كحلي',
          'كحلي داكن',
          'رمادي',
          'رمادي فاتح',
          'بيج',
          'رملي',
          'زيتي',
          'زيتوني',
          'عسلي',
          'جملي',
          'بني',
          'شوكولاتة',
          'عنابي',
          'أحمر',
          'وردي',
          'موف',
          'أزرق',
          'سماوي',
          'تيفاني',
          'أخضر',
          'خردلي',
          'برتقالي'
        ]
      },
      {
        name: 'المقاس',
        key: 'المقاس',
        type: 'String',
        values: [
          'XXS',
          'XS',
          'S',
          'M',
          'L',
          'XL',
          '2XL',
          '3XL',
          '4XL',
          '5XL',
          'موحد (Free Size)'
        ]
      }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId('6ad272d11340fa558ca45dcd'),
    title: 'أحذية وحقائب',
    slug: 'shoes-bags',
    order: 2,
    isActive: true,
    variantAttributes: [
      {
        name: 'اللون',
        key: 'اللون',
        type: 'String',
        values: [
          'أسود',
          'بني',
          'بيج',
          'كحلي',
          'جملي',
          'رمادي',
          'أبيض',
          'عنابي',
          'هافان',
          'رملي',
          'عسلي'
        ]
      },
      {
        name: 'المقاس',
        key: 'المقاس',
        type: 'String',
        values: [
          '35',
          '36',
          '37',
          '38',
          '39',
          '40',
          '41',
          '42',
          '43',
          '44',
          '45',
          '46'
        ]
      }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId('6ad272d11340fa558ca45dd0'),
    title: 'طاقة وبدائل',
    slug: 'energy-power',
    order: 3,
    isActive: true,
    variantAttributes: [
      {
        name: 'سعة البطارية',
        key: 'سعة البطارية',
        type: 'String',
        values: [
          '30Ah',
          '45Ah',
          '60Ah',
          '90Ah',
          '100Ah',
          '120Ah',
          '150Ah',
          '200Ah'
        ]
      },
      {
        name: 'القدرة / الواط',
        key: 'القدرة / الواط',
        type: 'String',
        values: [
          '300W',
          '600W',
          '1000W',
          '1200W',
          '1500W',
          '2000W',
          '3000W'
        ]
      },
      {
        name: 'اللون',
        key: 'اللون',
        type: 'String',
        values: [
          'رمادي داكن',
          'برتقالي شمسي',
          'أسود',
          'أبيض'
        ]
      }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId('6ad272d11340fa558ca45dd3'),
    title: 'شبكات واتصالات',
    slug: 'networks',
    order: 4,
    isActive: true,
    variantAttributes: [
      {
        name: 'سعة البطارية',
        key: 'سعة البطارية',
        type: 'String',
        values: [
          '3000mAh',
          '5000mAh',
          '10000mAh',
          '20000mAh'
        ]
      },
      {
        name: 'اللون',
        key: 'اللون',
        type: 'String',
        values: [
          'أبيض ناصع',
          'أسود مطفي',
          'رمادي'
        ]
      }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId('6ad272d11340fa558ca45dd6'),
    title: 'مؤونة وزيت زيتون',
    slug: 'provisions',
    order: 5,
    isActive: true,
    variantAttributes: [
      {
        name: 'الحجم / السعة',
        key: 'الحجم / السعة',
        type: 'String',
        values: [
          '500 مل',
          '1 لتر',
          '2 لتر',
          '3 لتر',
          '5 لتر',
          '16 لتر (تنكة)'
        ]
      }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId('6ad272d11340fa558ca45dd9'),
    title: 'عطور وعناية',
    slug: 'perfumes-care',
    order: 6,
    isActive: true,
    variantAttributes: [
      {
        name: 'الحجم / السعة',
        key: 'الحجم / السعة',
        type: 'String',
        values: [
          '30 مل',
          '50 مل',
          '100 مل',
          '150 مل',
          '200 مل',
          '250 مل'
        ]
      }
    ]
  }
];

async function restoreCategories() {
  const uri = process.env.DB_URL || 'mongodb://127.0.0.1:27017/sadeem_db';
  console.log('Connecting to MongoDB:', uri);
  await mongoose.connect(uri);
  console.log('Connected successfully!');

  const catCollection = mongoose.connection.db.collection('categories');
  const prodCollection = mongoose.connection.db.collection('products');

  console.log('\n--- Restoring Canonical Categories ---');
  for (const cat of CANONICAL_CATEGORIES) {
    const { _id, ...doc } = cat;
    const res = await catCollection.updateOne(
      { _id },
      { $set: doc },
      { upsert: true }
    );
    console.log(`✓ Restored: ${cat.title} (${cat.slug}) -> ID: ${_id} (Upserted: ${res.upsertedCount > 0 ? 'YES' : 'UPDATED'})`);
  }

  const allCategories = await catCollection.find({}).sort({ order: 1 }).toArray();
  console.log(`\nTotal categories in database now: ${allCategories.length}`);

  console.log('\n--- Checking Linked Products ---');
  for (const c of allCategories) {
    const count = await prodCollection.countDocuments({ categoryId: c._id });
    console.log(`Category "${c.title}" [${c._id}]: ${count} product(s) linked`);
  }

  // Check for any orphaned products
  const categoryIds = allCategories.map(c => c._id);
  const orphanedCount = await prodCollection.countDocuments({ categoryId: { $nin: categoryIds } });
  console.log(`\nOrphaned products without valid categoryId: ${orphanedCount}`);

  await mongoose.disconnect();
  console.log('\nCategory restoration finished successfully!');
}

restoreCategories().catch((err) => {
  console.error('Category restoration failed:', err);
  process.exit(1);
});
