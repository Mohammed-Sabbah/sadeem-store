require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const CATEGORY_UPDATES = {
  'ملابس وأزياء': [
    {
      name: 'اللون',
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
  ],
  'أحذية وحقائب': [
    {
      name: 'اللون',
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
  ],
  'طاقة وبدائل': [
    {
      name: 'سعة البطارية',
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
      values: [
        'رمادي داكن',
        'برتقالي شمسي',
        'أسود',
        'أبيض'
      ]
    }
  ],
  'شبكات واتصالات': [
    {
      name: 'سعة البطارية',
      values: [
        '3000mAh',
        '5000mAh',
        '10000mAh',
        '20000mAh'
      ]
    },
    {
      name: 'اللون',
      values: [
        'أبيض ناصع',
        'أسود مطفي',
        'رمادي'
      ]
    }
  ],
  'مؤونة وزيت زيتون': [
    {
      name: 'الحجم / السعة',
      values: [
        '500 مل',
        '1 لتر',
        '2 لتر',
        '3 لتر',
        '5 لتر',
        '16 لتر (تنكة)'
      ]
    }
  ],
  'عطور وعناية': [
    {
      name: 'الحجم / السعة',
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
};

async function run() {
  const uri = process.env.DB_URL || 'mongodb://127.0.0.1:27017/sadeem_db';
  console.log('Connecting to:', uri);
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  for (const [title, variantAttributes] of Object.entries(CATEGORY_UPDATES)) {
    const res = await Category.updateOne(
      { title },
      { $set: { variantAttributes } }
    );
    console.log(`Updated "${title}": matched ${res.matchedCount}, modified ${res.modifiedCount}`);
  }

  const allCats = await Category.find({}).lean();
  console.log('\n--- Current Categories Status ---');
  allCats.forEach(c => {
    console.log(`Category: ${c.title} (${c._id})`);
    c.variantAttributes.forEach(attr => {
      console.log(`  - ${attr.name}: [${attr.values.length} values] -> ${attr.values.slice(0, 5).join(', ')}...`);
    });
  });

  await mongoose.disconnect();
  console.log('\nUpdate completed successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
