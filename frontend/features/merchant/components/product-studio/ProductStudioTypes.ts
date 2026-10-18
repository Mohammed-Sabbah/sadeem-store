// =========================================================
// Product Studio Types and Realistic Constants
// =========================================================

export type StudioTab = 'overview' | 'editor' | 'settings';

export interface ProductReview {
  id: string;
  authorName: string;
  city: string;
  rating: number;
  date: string;
  variantSummary?: string;
  comment: string;
  verifiedPurchase: boolean;
}

// Color Swatches Palette (Accurate RGB/Hex for Central Gaza Merchants)
export const COLOR_SWATCHES: Record<string, { hex: string; border?: boolean }> = {
  'أسود': { hex: '#18181B' },
  'أبيض': { hex: '#FFFFFF', border: true },
  'كحلي': { hex: '#1E3A8A' },
  'رمادي': { hex: '#71717A' },
  'بيج': { hex: '#E5D9C5' },
  'زيتي': { hex: '#4D5D43' },
  'عسلي': { hex: '#B8621B' },
  'عنابي': { hex: '#831843' },
  'بني': { hex: '#78350F' },
  'أزرق': { hex: '#2563EB' },
  'وردي': { hex: '#F472B6' },
  'سماوي': { hex: '#38BDF8' },
  'رملي': { hex: '#D2B48C' },
  'فحمي': { hex: '#27272A' },
  'زيتوني': { hex: '#556B2F' },
  'أخضر': { hex: '#15803D' },
  'أحمر': { hex: '#DC2626' },
};

// Quick Preset Suggestions
export const PRESET_COLORS = ['أسود', 'أبيض', 'كحلي', 'رمادي', 'بيج', 'زيتي', 'أزرق', 'عنابي', 'بني'];
export const PRESET_CLOTHING_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
export const PRESET_SHOE_SIZES = ['39', '40', '41', '42', '43', '44', '45'];

export const SAMPLE_REVIEWS: ProductReview[] = [
  {
    id: 'rev_1',
    authorName: 'أحمد محمود',
    city: 'دير البلح',
    rating: 5,
    date: 'منذ يومين',
    variantSummary: 'اللون: كحلي ناعم · المقاس: L',
    comment: 'الخامة ممتازة والتفصيل دقيق، قمت بمعاينة وتجربة القطعة عند الباب مع مندوب سَدِيم قبل دفع المبلغ. مصداقية تشغيلية نادرة.',
    verifiedPurchase: true,
  },
  {
    id: 'rev_2',
    authorName: 'سارة عبد الرحمن',
    city: 'مخيم النصيرات',
    rating: 5,
    date: 'منذ 5 أيام',
    variantSummary: 'اللون: بيج طبيعي · المقاس: M',
    comment: 'اللون في الواقع مطابق للصور تماماً، وصل في طرد سَدِيم الموحد وجمعت معه مشتريات من متجرين مختلفين بتوصيل 8 شيكل فقط.',
    verifiedPurchase: true,
  },
  {
    id: 'rev_3',
    authorName: 'إبراهيم سلامة',
    city: 'الزوايدة',
    rating: 4,
    date: 'منذ أسبوع',
    variantSummary: 'اللون: أبيض سحابي · المقاس: XL',
    comment: 'القطن مريح والمقاس مضبوط ومناسب للأجواء الحارة، أنصح بتوفير المزيد من الألوان الصيفية.',
    verifiedPurchase: true,
  },
];
