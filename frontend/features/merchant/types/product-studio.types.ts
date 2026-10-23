// =========================================================
// Product Studio Types and Realistic Constants
// Single Source of Truth for Merchant Product Studio
// =========================================================

export type ProductEditorMode = 'create' | 'edit';

export interface VariantRowState {
  id: string; // Real DB _id or temp generated ID
  dbId?: string; // Present only if it already exists in MongoDB
  attributes: Record<string, string>;
  price: number | '';
  compareAtPrice?: number | '';
  stock: number | '';
  sku?: string;
  status: 'active' | 'inActive';
  isEnabled?: boolean;
  image?: string;
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
