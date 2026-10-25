/**
 * سَدِيم (Sadeem) — القياسات والوحدات الفيزيائية المعتمدة
 * وحدات قياس ثابتة للمنتجات والخيارات (Measurement Units)
 */

const UNITS = [
    { key: 'mah', label: 'مللي أمبير (mAh)', symbol: 'mAh', category: 'electric' },
    { key: 'gb', label: 'جيجابايت (GB)', symbol: 'GB', category: 'digital' },
    { key: 'tb', label: 'تيرابايت (TB)', symbol: 'TB', category: 'digital' },
    { key: 'ml', label: 'ملليلتر (ml)', symbol: 'ml', category: 'volume' },
    { key: 'l', label: 'لتر (L)', symbol: 'L', category: 'volume' },
    { key: 'g', label: 'جرام (g)', symbol: 'g', category: 'weight' },
    { key: 'kg', label: 'كيلوجرام (kg)', symbol: 'kg', category: 'weight' },
    { key: 'cm', label: 'سنتيمتر (cm)', symbol: 'cm', category: 'dimension' },
    { key: 'm', label: 'متر (m)', symbol: 'm', category: 'dimension' },
    { key: 'piece', label: 'قطعة', symbol: 'قطعة', category: 'quantity' },
];

const UNIT_MAP = new Map(UNITS.map((u) => [u.key, u]));

function isValidUnit(unitKey) {
    if (!unitKey) return false;
    return UNIT_MAP.has(String(unitKey).toLowerCase().trim());
}

function getUnit(unitKey) {
    if (!unitKey) return null;
    return UNIT_MAP.get(String(unitKey).toLowerCase().trim()) || null;
}

function getUnitLabel(unitKey) {
    const unit = getUnit(unitKey);
    return unit ? unit.label : unitKey;
}

module.exports = {
    UNITS,
    isValidUnit,
    getUnit,
    getUnitLabel,
};
