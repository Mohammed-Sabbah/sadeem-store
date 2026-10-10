const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const OptionDefinition = require('../models/OptionDefinition');
const Category = require('../models/Category');

const DEFAULT_DEFINITIONS = [
    {
        key: 'color',
        label: 'اللون',
        type: 'COLOR',
        unit: null,
        values: [
            { key: 'black', label: 'أسود', hex: '#000000', sortOrder: 1 },
            { key: 'white', label: 'أبيض', hex: '#FFFFFF', sortOrder: 2 },
            { key: 'navy', label: 'كحلي', hex: '#1E3A8A', sortOrder: 3 },
            { key: 'grey', label: 'رمادي', hex: '#6B7280', sortOrder: 4 },
            { key: 'beige', label: 'بيج', hex: '#D4B996', sortOrder: 5 },
            { key: 'brown', label: 'بني', hex: '#78350F', sortOrder: 6 },
            { key: 'red', label: 'أحمر', hex: '#DC2626', sortOrder: 7 },
            { key: 'green', label: 'أخضر', hex: '#15803D', sortOrder: 8 },
            { key: 'blue', label: 'أزرق', hex: '#2563EB', sortOrder: 9 },
            { key: 'gold', label: 'ذهبي', hex: '#B08D57', sortOrder: 10 },
            { key: 'amber', label: 'كهرماني', hex: '#B8621B', sortOrder: 11 },
        ],
    },
    {
        key: 'size_clothing',
        label: 'مقاس الملابس',
        type: 'SIZE',
        unit: null,
        values: [
            { key: 'xs', label: 'XS', sortOrder: 1 },
            { key: 's', label: 'S', sortOrder: 2 },
            { key: 'm', label: 'M', sortOrder: 3 },
            { key: 'l', label: 'L', sortOrder: 4 },
            { key: 'xl', label: 'XL', sortOrder: 5 },
            { key: '2xl', label: '2XL', sortOrder: 6 },
            { key: '3xl', label: '3XL', sortOrder: 7 },
        ],
    },
    {
        key: 'size_shoes',
        label: 'مقاس الأحذية',
        type: 'SIZE',
        unit: null,
        values: [
            { key: '36', label: '36', sortOrder: 1 },
            { key: '37', label: '37', sortOrder: 2 },
            { key: '38', label: '38', sortOrder: 3 },
            { key: '39', label: '39', sortOrder: 4 },
            { key: '40', label: '40', sortOrder: 5 },
            { key: '41', label: '41', sortOrder: 6 },
            { key: '42', label: '42', sortOrder: 7 },
            { key: '43', label: '43', sortOrder: 8 },
            { key: '44', label: '44', sortOrder: 9 },
            { key: '45', label: '45', sortOrder: 10 },
            { key: '46', label: '46', sortOrder: 11 },
        ],
    },
    {
        key: 'storage',
        label: 'سعة التخزين',
        type: 'NUMERIC',
        unit: 'gb',
        values: [
            { key: '64gb', label: '64 جيجابايت', sortOrder: 1 },
            { key: '128gb', label: '128 جيجابايت', sortOrder: 2 },
            { key: '256gb', label: '256 جيجابايت', sortOrder: 3 },
            { key: '512gb', label: '512 جيجابايت', sortOrder: 4 },
            { key: '1tb', label: '1 تيرابايت', sortOrder: 5 },
        ],
    },
];

const CATEGORY_ALLOWED_OPTIONS_MAP = {
    fashion: ['color', 'size_clothing', 'size_shoes'],
    'power-electronics': ['color', 'storage'],
    'beauty-perfumes': ['color'],
    crafts: ['color'],
};

async function seedOptionDefinitions() {
    console.log('--- بدء زرع تعريفات الخيارات وتحديث تصنيفات سَدِيم ---');
    await connectDB();

    for (const def of DEFAULT_DEFINITIONS) {
        await OptionDefinition.findOneAndUpdate(
            { key: def.key },
            { $set: def },
            { upsert: true, new: true, runValidators: true }
        );
        console.log(`✔ تم تجهيز خيار: ${def.label} (${def.key})`);
    }

    for (const [slug, options] of Object.entries(CATEGORY_ALLOWED_OPTIONS_MAP)) {
        const updated = await Category.findOneAndUpdate(
            { slug },
            { $set: { allowedOptions: options } },
            { new: true }
        );
        if (updated) {
            console.log(`✔ تصنيف ${updated.title} (${slug}) -> الخيارات المسموحة: [${options.join(', ')}]`);
        }
    }

    console.log('✨ تم الانتهاء بنجاح!');
}

if (require.main === module) {
    seedOptionDefinitions()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('خطأ أثناء زرع الخيارات:', err);
            process.exit(1);
        });
}

module.exports = seedOptionDefinitions;
