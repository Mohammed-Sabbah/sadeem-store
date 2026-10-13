'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { merchantService } from '@/features/merchant/services/merchant.service';
import { taxonomyService, type CategoryItem } from '@/features/store/services/taxonomy.service';
import type {
  ProductItem,
  ProductOption,
  OptionDefinition,
} from '@/features/merchant/types/merchant.types';

// =========================================================
// Apple-Grade Crisp Architectural SVGs (Zero Emojis)
// =========================================================

function IconChartBar({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function IconSliders({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  );
}

function IconSettings({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconEye({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconEditPencil({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  );
}

function IconPackage({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function IconCurrencyShekel({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconStarSolid({ className = 'w-3.5 h-3.5 text-amber-500' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
    </svg>
  );
}

function IconShieldCheck({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconSpark({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function IconCheck({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconAlertTriangle({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function IconArrowRight({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function IconEyeOff({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function IconPhoto({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function IconUploadCloud({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
  );
}

function IconTrash({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function IconChevronDown({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function IconPlus({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function IconPalette({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l9.75 9.75" />
      <circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" />
      <circle cx="16.5" cy="7.5" r="1.25" fill="currentColor" />
      <circle cx="7.5" cy="13.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

function IconRuler({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6h16.5M6 9v3m4-3v2m4-2v3m4-3v2M3.75 6.75h16.5a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z" />
    </svg>
  );
}

function IconX({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconTruck({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v9.375m12-9.375H3.375" />
    </svg>
  );
}

function IconClock({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// Color Swatches Palette (Accurate RGB/Hex for Central Gaza Merchants)
const COLOR_SWATCHES: Record<string, { hex: string; border?: boolean }> = {
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

// Data models
interface ProductReview {
  id: string;
  authorName: string;
  city: string;
  rating: number;
  date: string;
  variantSummary?: string;
  comment: string;
  verifiedPurchase: boolean;
}

const SAMPLE_REVIEWS: ProductReview[] = [
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

type StudioTab = 'overview' | 'editor' | 'settings';

// Quick Preset Suggestions
const PRESET_COLORS = ['أسود', 'أبيض', 'كحلي', 'رمادي', 'بيج', 'زيتي', 'أزرق', 'عنابي', 'بني'];
const PRESET_CLOTHING_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
const PRESET_SHOE_SIZES = ['39', '40', '41', '42', '43', '44', '45'];

export default function MerchantProductStudioPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  // Active Hub Tab
  const [activeTab, setActiveTab] = useState<StudioTab>('overview');

  // Loading & Action states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core entities
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [allowedDefinitions, setAllowedDefinitions] = useState<OptionDefinition[]>([]);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isAnonymousVendor, setIsAnonymousVendor] = useState(false);

  // Gallery (Device Upload & Cloud Readiness)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Mode: Simple vs Configurable
  const [isSimple, setIsSimple] = useState(false);

  // Simple Product Fields
  const [simplePrice, setSimplePrice] = useState<number | string>(50);
  const [simpleCompareAtPrice, setSimpleCompareAtPrice] = useState<number | string>('');
  const [simpleStock, setSimpleStock] = useState<number | string>(10);
  const [simpleSku, setSimpleSku] = useState('');

  // Configurable Options & Visual Color-Image Map
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [optionTagInputs, setOptionTagInputs] = useState<Record<number, string>>({});
  const [colorImageMap, setColorImageMap] = useState<Record<string, string>>({});
  const [deletedVariantKeys, setDeletedVariantKeys] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState<Record<number, boolean>>({});

  // Bulk Values Tool
  const [bulkPriceInput, setBulkPriceInput] = useState('');
  const [bulkStockInput, setBulkStockInput] = useState('');

  // Generated Variants Matrix
  const [variants, setVariants] = useState<
    Array<{
      _id?: string;
      sku: string;
      attributes: Record<string, string>;
      attrKey: string;
      price: number;
      compareAtPrice?: number | null;
      stock: number;
      isActive: boolean;
      images?: string[];
    }>
  >([]);

  // Bespoke Apple Popovers & Menus State
  const [isAddOptionOpen, setIsAddOptionOpen] = useState(false);
  const [activeValuePopoverIdx, setActiveValuePopoverIdx] = useState<number | null>(null);
  const [activeColorPhotoPopover, setActiveColorPhotoPopover] = useState<string | null>(null);
  const [customColorInput, setCustomColorInput] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');

  // Global Click-Outside Listener to dismiss popovers seamlessly
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('[data-popover]')) {
        setIsAddOptionOpen(false);
        setActiveValuePopoverIdx(null);
        setActiveColorPhotoPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Initial Load
  useEffect(() => {
    if (!productId) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      merchantService.getProductById(productId),
      taxonomyService.fetchCategories(),
      merchantService.fetchOptionDefinitions(),
    ])
      .then(([prodRes, cats, optRes]) => {
        if (!isMounted) return;
        setCategories(cats);

        if (prodRes.success && prodRes.data) {
          const p = prodRes.data;
          setProduct(p);
          setName(p.name || p.title || '');
          setDescription(p.description || '');
          const currentCatId = typeof p.categoryId === 'object' ? p.categoryId._id : p.categoryId;
          setCategoryId(currentCatId || (cats[0]?._id ?? ''));
          setImages(p.images && p.images.length > 0 ? p.images : []);
          setIsActive(p.isActive !== undefined ? p.isActive : true);
          setIsFeatured(p.isFeatured || false);
          setIsAnonymousVendor(p.isAnonymousVendor || false);

          const hasOptions = Array.isArray(p.options) && p.options.length > 0;
          setIsSimple(!hasOptions);

          const mappedOptions = (p.options || []).map((o) => ({
            key: o.key,
            source: o.source || 'DEFINED',
            label: o.label || o.name,
            name: o.name || o.label || o.key || '',
            type: o.type || 'TEXT',
            unit: o.unit || null,
            values: o.values || [],
          }));
          setOptions(mappedOptions);

          const mappedVariants = (p.variants || []).map((v) => ({
            _id: v._id,
            sku: v.sku,
            attributes:
              v.attributes instanceof Map ? Object.fromEntries(v.attributes) : v.attributes || {},
            attrKey: v.attrKey || 'default',
            price: Number(v.price) || 0,
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
            stock: Number(v.stock) || 0,
            isActive: v.isActive !== undefined ? v.isActive : true,
            images: v.images || (v.image ? [v.image] : []),
          }));
          setVariants(mappedVariants);

          if (!hasOptions && mappedVariants.length > 0) {
            setSimplePrice(mappedVariants[0].price);
            setSimpleCompareAtPrice(mappedVariants[0].compareAtPrice ?? '');
            setSimpleStock(mappedVariants[0].stock);
            setSimpleSku(mappedVariants[0].sku);
          }
        } else {
          setErrorMessage(prodRes.message || 'تعذر تحميل بيانات المنتج');
        }

        if (optRes.success && optRes.data?.definitions) {
          setAllowedDefinitions(optRes.data.definitions);
        }
      })
      .catch((err) => {
        console.error('Error loading product studio:', err);
        if (isMounted) setErrorMessage('حدث خطأ في الاتصال بالخادم');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Load category options on category switch
  useEffect(() => {
    if (!categoryId) return;
    merchantService.fetchOptionsByCategory(categoryId).then((res) => {
      if (res.success && res.data?.definitions) {
        setAllowedDefinitions(res.data.definitions);
      }
    });
  }, [categoryId]);

  // Calculated Metrics
  const variantsCount = isSimple ? 1 : variants.length;

  const totalStock = useMemo(() => {
    if (isSimple) return Number(simpleStock) || 0;
    return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }, [isSimple, simpleStock, variants]);

  const minPrice = useMemo(() => {
    if (isSimple) return Number(simplePrice) || 0;
    if (variants.length === 0) return 0;
    return Math.min(...variants.map((v) => Number(v.price) || 0));
  }, [isSimple, simplePrice, variants]);

  const maxPrice = useMemo(() => {
    if (isSimple) return Number(simplePrice) || 0;
    if (variants.length === 0) return 0;
    return Math.max(...variants.map((v) => Number(v.price) || 0));
  }, [isSimple, simplePrice, variants]);

  // =========================================================
  // Gallery Handlers (Device Upload & Cloud Readiness)
  // =========================================================

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    const fileArray = Array.from(files);
    const newUrls: string[] = [];
    let loadedCount = 0;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          newUrls.push(loadEvent.target.result as string);
        }
        loadedCount++;
        if (loadedCount === fileArray.length) {
          setImages((prev) => [...prev, ...newUrls]);
          setIsProcessingFiles(false);
          setUploadFeedback(`تمت إضافة ${newUrls.length} صور من جهازك بنجاح`);
          setTimeout(() => setUploadFeedback(null), 3500);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    const cleanUrl = newImageUrl.trim();
    if (!cleanUrl) return;
    setImages((prev) => [...prev, cleanUrl]);
    setNewImageUrl('');
    setShowUrlInput(false);
  };

  const handleSetPrimaryImage = (imgIdx: number) => {
    if (imgIdx === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [target] = next.splice(imgIdx, 1);
      next.unshift(target);
      return next;
    });
  };

  const handleRemoveImage = (imgIdx: number) => {
    const targetUrl = images[imgIdx];
    setImages((prev) => prev.filter((_, idx) => idx !== imgIdx));

    const updatedMap = { ...colorImageMap };
    for (const color in updatedMap) {
      if (updatedMap[color] === targetUrl) {
        delete updatedMap[color];
      }
    }
    setColorImageMap(updatedMap);
  };

  // =========================================================
  // Effortless Options & Automatic Variants Live-Sync
  // =========================================================

  // Add Option helper (Color / Size / Custom)
  const handleAddPredefinedOption = (type: 'COLOR' | 'SIZE' | 'CUSTOM') => {
    if (type === 'COLOR') {
      if (options.some((o) => o.type === 'COLOR' || o.name === 'اللون')) return;
      setOptions((prev) => [
        ...prev,
        {
          key: 'opt_color',
          source: 'DEFINED',
          label: 'اللون',
          name: 'اللون',
          type: 'COLOR',
          unit: null,
          values: ['أسود', 'أبيض'],
        },
      ]);
    } else if (type === 'SIZE') {
      if (options.some((o) => o.type === 'SIZE' || o.name === 'المقاس')) return;
      setOptions((prev) => [
        ...prev,
        {
          key: 'opt_size',
          source: 'DEFINED',
          label: 'المقاس',
          name: 'المقاس',
          type: 'SIZE',
          unit: null,
          values: ['M', 'L', 'XL'],
        },
      ]);
    } else {
      const idx = options.length + 1;
      setOptions((prev) => [
        ...prev,
        {
          key: `opt_custom_${Date.now()}`,
          source: 'CUSTOM',
          label: `خيار ${idx}`,
          name: `خيار ${idx}`,
          type: 'TEXT',
          unit: null,
          values: [],
        },
      ]);
    }
  };

  const handleRemoveOption = (indexToRemove: number) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddOptionValue = (optIndex: number, specificVal?: string) => {
    const valToAdd = (specificVal || optionTagInputs[optIndex] || '').trim();
    if (!valToAdd) return;

    setOptions((prev) => {
      const copy = [...prev];
      const opt = copy[optIndex];
      if (!opt.values.includes(valToAdd)) {
        copy[optIndex] = { ...opt, values: [...opt.values, valToAdd] };
      }
      return copy;
    });

    if (!specificVal) {
      setOptionTagInputs((prev) => ({ ...prev, [optIndex]: '' }));
    }
  };

  const handleRemoveOptionValue = (optIndex: number, valToRemove: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      const opt = copy[optIndex];
      copy[optIndex] = {
        ...opt,
        values: opt.values.filter((v) => v !== valToRemove),
      };
      return copy;
    });

    if (colorImageMap[valToRemove]) {
      const nextMap = { ...colorImageMap };
      delete nextMap[valToRemove];
      setColorImageMap(nextMap);
    }
  };

  // Visual Color-Image Tap Binding
  const handleBindColorImage = (colorVal: string, imageUrl: string) => {
    const nextMap = { ...colorImageMap, [colorVal]: imageUrl };
    setColorImageMap(nextMap);

    const colorOpt = options.find(
      (o) => o.type === 'COLOR' || o.name === 'اللون' || o.label === 'اللون'
    );
    const colorKey = colorOpt ? colorOpt.name || colorOpt.label || 'اللون' : 'اللون';

    setVariants((prev) =>
      prev.map((v) => {
        if (v.attributes[colorKey] === colorVal) {
          return { ...v, images: [imageUrl] };
        }
        return v;
      })
    );
  };

  // Automatic Real-Time Live Sync of Variants (No confusing manual button!)
  useEffect(() => {
    if (isSimple) return;
    const validOptions = options.filter((o) => o.values && o.values.length > 0);
    if (validOptions.length === 0) return;

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
        [[]]
      );
    };

    const arrays = validOptions.map((o) => o.values);
    const combos = cartesian(arrays);
    if (combos.length > 100) return;

    const categoryPrefix = (categories.find((c) => c._id === categoryId)?.slug || 'ITM')
      .slice(0, 3)
      .toUpperCase();

    const colorOpt = options.find(
      (o) => o.type === 'COLOR' || o.name === 'اللون' || o.label === 'اللون'
    );
    const colorKey = colorOpt ? colorOpt.name || colorOpt.label || 'اللون' : 'اللون';

    setVariants((prev) => {
      return combos
        .map((combo, idx) => {
          const attrs: Record<string, string> = {};
          validOptions.forEach((opt, optIdx) => {
            attrs[opt.name || opt.label || `opt_${optIdx}`] = combo[optIdx];
          });

          const attrKey = Object.entries(attrs)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join('|');

          // Skip if user explicitly deleted this specific combination
          if (deletedVariantKeys.includes(attrKey)) {
            return null;
          }

          const existing = prev.find((v) => v.attrKey === attrKey);
          const boundImage = attrs[colorKey] ? colorImageMap[attrs[colorKey]] : undefined;

          if (existing) {
            if (boundImage && (!existing.images || existing.images[0] !== boundImage)) {
              return { ...existing, images: [boundImage] };
            }
            return existing;
          }

          const cleanValues = Object.values(attrs)
            .map((v) => v.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'VAR')
            .slice(0, 2)
            .join('-');

          const defaultPrice = typeof simplePrice === 'number' && simplePrice > 0 ? simplePrice : 50;
          const defaultStock = typeof simpleStock === 'number' && simpleStock > 0 ? simpleStock : 10;

          return {
            sku: `SDM-${categoryPrefix}-${cleanValues || 'VAR'}-${idx + 1}-${Math.floor(
              100 + Math.random() * 900
            )}`,
            attributes: attrs,
            attrKey,
            price: Number(defaultPrice),
            compareAtPrice: null,
            stock: Number(defaultStock),
            isActive: true,
            images: boundImage ? [boundImage] : images.slice(0, 1),
          };
        })
        .filter(Boolean) as typeof variants;
    });
  }, [
    isSimple,
    options,
    categoryId,
    categories,
    colorImageMap,
    images,
    simplePrice,
    simpleStock,
    deletedVariantKeys,
  ]);

  // Bulk Apply Values
  const handleApplyBulkPrice = () => {
    const val = Number(bulkPriceInput);
    if (isNaN(val) || val < 0) {
      alert('يرجى إدخال سعر بيع صحيح');
      return;
    }
    setVariants((prev) => prev.map((v) => ({ ...v, price: val })));
    setBulkPriceInput('');
  };

  const handleApplyBulkStock = () => {
    const val = parseInt(bulkStockInput);
    if (isNaN(val) || val < 0) {
      alert('يرجى إدخال كمية مخزون صحيحة');
      return;
    }
    setVariants((prev) => prev.map((v) => ({ ...v, stock: val })));
    setBulkStockInput('');
  };

  // Quick Delta Stock
  const handleQuickDeltaStock = async (variantId: string | undefined, delta: number) => {
    if (!productId) return;
    const targetVariant = variants.find((v) => v._id === variantId || v.sku === variantId);
    if (!targetVariant) return;

    const newStock = Math.max(0, targetVariant.stock + delta);
    setVariants((prev) =>
      prev.map((v) =>
        v._id === variantId || v.sku === variantId ? { ...v, stock: newStock } : v
      )
    );

    await merchantService.quickUpdateStock(productId, newStock, targetVariant._id || targetVariant.sku);
  };

  // Save changes
  const handleSaveProduct = async () => {
    if (!name.trim()) {
      setErrorMessage('يرجى إدخال اسم الصنف');
      return;
    }

    if (!isSimple && variants.length === 0) {
      setErrorMessage('يجب إضافة خيار واحد على الأقل للمنتج متعدد الخيارات');
      return;
    }

    if (!isSimple && variants.length > 100) {
      setErrorMessage('تجاوزت الحد الأقصى للأصناف (100 صنف كحد أقصى)');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    const result = await merchantService.updateProduct(productId, {
      name,
      title: name,
      description,
      categoryId,
      images,
      options: isSimple ? [] : options,
      variants: isSimple
        ? [
            {
              _id: variants[0]?._id,
              sku: simpleSku.trim() || `SDM-ITM-${Math.floor(1000 + Math.random() * 9000)}`,
              attributes: {},
              attrKey: 'default',
              price: Number(simplePrice) || 0,
              compareAtPrice: simpleCompareAtPrice ? Number(simpleCompareAtPrice) : null,
              stock: Math.max(0, parseInt(String(simpleStock)) || 0),
              isActive: true,
              images: images.slice(0, 1),
            },
          ]
        : variants,
      isActive,
      isFeatured,
      isAnonymousVendor,
    });

    setIsSaving(false);
    if (result.success && result.data) {
      setProduct(result.data);
      setSaveSuccessMessage('تم حفظ كافة التعديلات بنجاح وتحديث كتالوج المتجر.');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } else {
      setErrorMessage(result.message || 'فشل حفظ التعديلات');
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف الصنف «${name}» نهائياً من المتجر؟`)) {
      return;
    }
    setIsSaving(true);
    const res = await merchantService.deleteProduct(productId);
    setIsSaving(false);
    if (res.success) {
      router.push('/merchant/dashboard');
    } else {
      setErrorMessage('تعذر حذف المنتج حالياً');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center font-almarai text-right">
        <div className="w-8 h-8 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4" />
        <h2 className="text-xs font-bold text-brand-dark">جاري فتح مركز إدارة الصنف...</h2>
      </div>
    );
  }

  if (!product && !isLoading) {
    return (
      <div className="max-w-md mx-auto p-8 text-center font-almarai text-right">
        <div className="bg-brand-card p-6 rounded-2xl border border-brand-border/60 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-brand-surface mx-auto flex items-center justify-center text-brand-muted mb-3">
            <IconAlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-brand-dark mb-1">المنتج غير موجود</h2>
          <p className="text-xs text-brand-muted mb-4">قد يكون تم نقله أو حذفه من قبل إدارة المتجر.</p>
          <Link
            href="/merchant/dashboard"
            className="inline-flex items-center gap-1.5 bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-primary-hover active:scale-[0.97] transition-transform duration-100"
          >
            <span>العودة للكتالوج</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage =
    images[0] ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80';

  const colorOpt = options.find(
    (o) => o.type === 'COLOR' || o.name === 'اللون' || o.label === 'اللون'
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 font-almarai text-right pb-28">
      {/* ========================================================= */}
      {/* 1. Serene Master Header (No Nested Boxiness)              */}
      {/* ========================================================= */}
      <div className="mb-6 space-y-4">
        {/* Top Breadcrumb & Metadata */}
        <div className="flex items-center justify-between gap-3 text-xs text-brand-muted/80">
          <Link
            href="/merchant/dashboard"
            className="hover:text-brand-primary transition-colors flex items-center gap-1 font-bold"
          >
            <IconArrowRight className="w-3.5 h-3.5" />
            <span>كتالوج المتجر</span>
            <span className="text-brand-border mx-1">/</span>
            <span>{categories.find((c) => c._id === categoryId)?.title || 'عام'}</span>
          </Link>

          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="text-brand-muted">الرمز المرجعي:</span>
            <span className="font-mono text-brand-dark bg-brand-surface px-2 py-0.5 rounded-md border border-brand-border/60">
              {productId.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Title, Photo & Global Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-brand-border/70 bg-brand-surface shrink-0 shadow-2xs">
              <img src={primaryImage} alt={name} className="w-full h-full object-cover" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-brand-dark tracking-tight leading-tight">
                  {name || 'صنف بدون اسم'}
                </h1>
                {isActive ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-brand-trust-soft text-brand-trust border-brand-trust/30">
                    معروض بالمتجر
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-brand-surface text-brand-muted border-brand-border/60">
                    مخفي مؤقتاً
                  </span>
                )}
                {isAnonymousVendor && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-zinc-100 text-zinc-600 border-zinc-200">
                    توريد مباشر (هوية المتجر مخفية)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs mt-1 text-brand-muted">
                <span className="font-black text-brand-dark">
                  {minPrice === maxPrice ? `${minPrice} ₪` : `${minPrice} - ${maxPrice} ₪`}
                </span>
                <span>•</span>
                <span className="font-bold text-brand-trust">{totalStock} قطعة متوفرة</span>
                <span>•</span>
                <span>{isSimple ? 'صنف مفرد بسيط' : `${variantsCount} أصناف مصفوفية`}</span>
              </div>
            </div>
          </div>

          {/* Quick Header Navigation Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href={`/product/${productId}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-brand-card hover:bg-brand-surface text-brand-dark text-xs font-bold border border-brand-border/80 transition-colors flex items-center gap-1.5 shadow-2xs active:scale-[0.97]"
              title="معاينة كيف يرى الزبون هذا الصنف في متجر سَدِيم"
            >
              <IconEye className="w-3.5 h-3.5 text-brand-muted" />
              <span>معاينة كزبون</span>
            </Link>

            {activeTab === 'overview' ? (
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover active:scale-[0.97] transition-transform duration-100 shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <IconEditPencil className="w-3.5 h-3.5" />
                <span>تعديل الصنف</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover active:scale-[0.97] transition-transform duration-100 shadow-2xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isSaving && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>حفظ التعديلات</span>
              </button>
            )}
          </div>
        </div>

        {/* Apple-Style Fluid Segmented Control (100% Mobile Visibility) */}
        <div className="pt-2">
          <div className="w-full grid grid-cols-3 p-1 rounded-2xl bg-brand-surface/90 border border-brand-border/70 gap-1 sm:w-auto sm:inline-flex">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 sm:px-4 rounded-xl text-center text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                activeTab === 'overview'
                  ? 'bg-brand-card text-brand-dark shadow-xs border border-brand-border/60 font-black'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              <IconChartBar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
              <span className="truncate">نظرة عامة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`py-2 px-1 sm:px-4 rounded-xl text-center text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                activeTab === 'editor'
                  ? 'bg-brand-card text-brand-dark shadow-xs border border-brand-border/60 font-black'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              <IconSliders className="w-3.5 h-3.5 text-brand-primary shrink-0" />
              <span className="truncate">بيانات الصنف</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 sm:px-4 rounded-xl text-center text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                activeTab === 'settings'
                  ? 'bg-brand-card text-brand-dark shadow-xs border border-brand-border/60 font-black'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              <IconSettings className="w-3.5 h-3.5 text-brand-muted shrink-0" />
              <span className="truncate">الإعدادات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Bar */}
      {saveSuccessMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-brand-trust-soft text-brand-trust border border-brand-trust/30 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <IconCheck className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <IconAlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & REVIEWS (Serene Product Dashboard)      */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Key Metrics Cards (Apple Design, Zero Emojis) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border/60 shadow-xs">
              <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
                <span>المخزون الإجمالي</span>
                <IconPackage className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-brand-dark">
                {totalStock}{' '}
                <span className="text-xs font-normal text-brand-muted">قطعة</span>
              </div>
              <div className="text-[11px] text-brand-muted mt-1">
                {totalStock > 0 ? 'متاح للطلب المباشر في الوسطى' : 'نفد المخزون حالياً'}
              </div>
            </div>

            <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border/60 shadow-xs">
              <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
                <span>نطاق الأسعار</span>
                <IconCurrencyShekel className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-brand-dark">
                {minPrice === maxPrice ? `${minPrice} ₪` : `${minPrice} - ${maxPrice} ₪`}
              </div>
              <div className="text-[11px] text-brand-muted mt-1">شامل عمولة سَدِيم</div>
            </div>

            <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border/60 shadow-xs">
              <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
                <span>تقييم الزبائن</span>
                <IconStarSolid className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-brand-dark flex items-center gap-1.5">
                <span>4.8</span>
                <span className="text-xs font-normal text-brand-muted">من 5</span>
              </div>
              <div className="text-[11px] text-brand-trust mt-1">100% نسبة رضا المشترين</div>
            </div>

            <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border/60 shadow-xs">
              <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
                <span>أمان الشحنة</span>
                <IconShieldCheck className="w-4 h-4 text-brand-trust" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-brand-trust">طرد موحد</div>
              <div className="text-[11px] text-brand-muted mt-1">توصيل 8 ₪ ومعاينة عند الباب</div>
            </div>
          </div>

          {/* Quick Variants Inventory Snapshot */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-6 border border-brand-border/60 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border/40">
              <div>
                <h2 className="text-sm font-black text-brand-dark">
                  حالة توفر الأصناف في المستودع
                </h2>
                <p className="text-[11px] text-brand-muted mt-0.5">
                  تعديل سريع للمخزون بدون الحاجة للدخول للمحرر
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 cursor-pointer"
              >
                <span>إدارة كامل الخيارات</span>
                <IconArrowRight className="w-3 h-3" />
              </button>
            </div>

            {isSimple ? (
              <div className="flex items-center justify-between p-4 rounded-xl bg-brand-surface/30 border border-brand-border/60">
                <div className="flex items-center gap-3">
                  <img
                    src={primaryImage}
                    alt={name}
                    className="w-12 h-12 rounded-xl object-cover border border-brand-border/60 shrink-0 bg-brand-surface"
                  />
                  <div>
                    <div className="text-xs font-black text-brand-dark">{name}</div>
                    <div className="text-[11px] text-brand-muted mt-0.5">
                      صنف مفرد بسعر {simplePrice} ₪ · كود:{' '}
                      <span className="font-mono">{simpleSku || 'SDM-DEFAULT'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-brand-card p-1 rounded-xl border border-brand-border/60 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Math.max(0, Number(simpleStock) - 1);
                      setSimpleStock(cur);
                      merchantService.quickUpdateStock(productId, cur);
                    }}
                    className="w-8 h-8 rounded-lg bg-brand-surface hover:bg-brand-border/40 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-black text-xs text-brand-dark tabular-nums">
                    {simpleStock}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Number(simpleStock) + 1;
                      setSimpleStock(cur);
                      merchantService.quickUpdateStock(productId, cur);
                    }}
                    className="w-8 h-8 rounded-lg bg-brand-surface hover:bg-brand-border/40 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-100"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {variants.map((v, vIdx) => {
                  const attrSummary =
                    Object.entries(v.attributes || {})
                      .map(([_, val]) => val)
                      .join(' · ') || 'افتراضي';

                  const variantPhoto =
                    v.images && v.images.length > 0 ? v.images[0] : primaryImage;

                  return (
                    <div
                      key={v._id || vIdx}
                      className="bg-brand-surface/30 rounded-xl p-3.5 border border-brand-border/60 flex items-center justify-between gap-3 hover:bg-brand-surface/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={variantPhoto}
                          alt={attrSummary}
                          className="w-11 h-11 rounded-xl object-cover border border-brand-border/60 shrink-0 bg-brand-surface"
                        />
                        <div>
                          <div className="text-xs font-black text-brand-dark">{attrSummary}</div>
                          <div className="text-[10px] text-brand-muted mt-0.5">
                            {v.price} ₪ · <span className="font-mono">{v.sku}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-brand-card p-1 rounded-xl border border-brand-border/60 shadow-2xs shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuickDeltaStock(v._id || v.sku, -1)}
                          className="w-7 h-7 rounded-lg bg-brand-surface hover:bg-brand-border/40 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-100"
                          title="إنقاص المخزون قطعة واحدة"
                        >
                          -
                        </button>
                        <span
                          className={`w-7 text-center font-black text-xs tabular-nums ${
                            v.stock === 0 ? 'text-red-600' : 'text-brand-dark'
                          }`}
                        >
                          {v.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickDeltaStock(v._id || v.sku, 1)}
                          className="w-7 h-7 rounded-lg bg-brand-surface hover:bg-brand-border/40 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-100"
                          title="زيادة المخزون قطعة واحدة"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer Reviews & Feedback Section (Serene Quiet Luxury, Zero Card-in-Card Noise) */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-6 border border-brand-border/60 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-brand-border/40">
              <div>
                <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                  <IconStarSolid className="w-4 h-4 text-amber-500" />
                  <span>تقييمات ومعاينة الزبائن</span>
                </h2>
                <p className="text-[11px] text-brand-muted mt-0.5">
                  انطباعات موثقة من زبائن استلموا وعاينوا هذا الصنف عند باب المنزل في المحافظة الوسطى
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto bg-brand-surface/70 px-3 py-1.5 rounded-xl border border-brand-border/70 text-xs">
                <span className="text-sm font-black text-brand-dark">4.8</span>
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <IconStarSolid key={i} className="w-3 h-3 text-amber-500" />
                  ))}
                </div>
                <span className="text-[11px] text-brand-muted font-bold mr-1">
                  • {SAMPLE_REVIEWS.length} تقييمات
                </span>
              </div>
            </div>

            <div className="divide-y divide-brand-border/40">
              {SAMPLE_REVIEWS.map((rev) => (
                <div key={rev.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                  {/* Top metadata line: Author name, city, verification, date, and rating stars */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-bold text-brand-dark">{rev.authorName}</span>
                      <span className="text-brand-muted/40">•</span>
                      <span className="text-[11px] text-brand-muted">{rev.city}</span>
                      {rev.verifiedPurchase && (
                        <>
                          <span className="text-brand-muted/40">•</span>
                          <span className="text-[11px] font-bold text-brand-trust flex items-center gap-0.5">
                            <IconCheck className="w-3 h-3" />
                            <span>معاينة مؤكدة</span>
                          </span>
                        </>
                      )}
                      <span className="text-brand-muted/40">•</span>
                      <span className="text-[11px] text-brand-muted">{rev.date}</span>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-500 self-start sm:self-auto">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <IconStarSolid key={i} className="w-3 h-3" />
                      ))}
                    </div>
                  </div>

                  {/* Comment text */}
                  <p className="text-xs text-brand-dark/90 leading-relaxed font-normal">
                    {rev.comment}
                  </p>

                  {/* Purchased variant summary */}
                  {rev.variantSummary && (
                    <div className="text-[10px] text-brand-muted flex items-center gap-1.5 pt-0.5">
                      <span className="font-medium text-brand-muted/70">المواصفات المشتراة:</span>
                      <span className="font-bold text-brand-dark/80 bg-brand-surface/80 px-2 py-0.5 rounded-md border border-brand-border/50">
                        {rev.variantSummary}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PRODUCT STUDIO & OPTIONS EDITOR                    */}
      {/* ========================================================= */}
      {activeTab === 'editor' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Step 1: Basic Identity & Classification */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs">
            <h2 className="text-sm font-black text-brand-dark mb-4 pb-3 border-b border-brand-border/40 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                1
              </span>
              <span>البيانات الأساسية والتصنيف</span>
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">
                    اسم الصنف المعروض للزبائن <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: قميص كتان سديمي ناعم"
                    className="w-full h-11 px-3.5 text-base sm:text-xs font-bold rounded-xl border border-brand-border/70 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">
                    التصنيف المعتمد <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <IconPackage className="w-4 h-4 text-brand-muted absolute right-3.5 pointer-events-none" />
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full h-11 pr-10 pl-9 text-base sm:text-xs font-bold rounded-xl border border-brand-border/70 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all appearance-none cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                    <IconChevronDown className="w-3.5 h-3.5 text-brand-muted absolute left-3.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5">الوصف والمواصفات</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب وصفاً دقيقاً للمنتج وخاماته وطريقة العناية به..."
                  className="w-full p-3.5 text-base sm:text-xs rounded-xl border border-brand-border/70 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary transition-all resize-y"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Gallery & Media (Device Selection + Cloud Storage Interface) */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-brand-border/40">
              <div>
                <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  <span>معرض صور الصنف ({images.length})</span>
                </h2>
                <p className="text-[11px] text-brand-muted mt-0.5">
                  اختر صور الصنف من هاتفك أو جهازك. الصورة الأولى ستكون غلاف الصنف الرئيسي.
                </p>
              </div>

              {uploadFeedback && (
                <span className="text-[11px] font-bold text-brand-trust bg-brand-trust-soft px-3 py-1 rounded-lg border border-brand-trust/30 flex items-center gap-1 self-start sm:self-auto animate-fadeIn">
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>{uploadFeedback}</span>
                </span>
              )}
            </div>

            {/* Hidden Native File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleDeviceFileUpload}
            />

            {/* Upload Zone & Thumbnails */}
            <div className="space-y-4">
              {/* If no images yet: Large Hero Drop/Upload Area */}
              {images.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-brand-border/90 hover:border-brand-primary/70 bg-brand-surface/40 hover:bg-brand-surface/70 rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer group active:scale-[0.99]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary-soft text-brand-primary mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                    <IconPhoto className="w-6 h-6" />
                  </div>
                  <div className="text-xs sm:text-sm font-black text-brand-dark mb-1">
                    اضغط لاختيار صور من هاتفك أو جهازك (أو اسحبها هنا)
                  </div>
                  <p className="text-[11px] text-brand-muted max-w-sm mx-auto leading-relaxed">
                    يدعم صور JPG, PNG, WEBP بدقة عالية · يمكنك اختيار عدة صور معاً
                  </p>
                  <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-card border border-brand-border/70 text-[10px] font-bold text-brand-muted">
                    <IconUploadCloud className="w-3.5 h-3.5 text-brand-primary" />
                    <span>واجهة مهيأة للربط التلقائي بخدمة الرفع السحابي</span>
                  </div>
                </div>
              ) : (
                /* Grid of selected images */
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-brand-border/80 group bg-brand-surface shadow-2xs"
                    >
                      <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />

                      {/* Primary Cover Badge */}
                      {idx === 0 ? (
                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          الغلاف الرئيسي
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-brand-card/95 hover:bg-white text-brand-dark text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs transition-opacity cursor-pointer"
                        >
                          تعيين كغلاف
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 left-1.5 w-6 h-6 bg-black/75 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer shadow-xs"
                        title="حذف الصورة من المعرض"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Add more button tile in the grid */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingFiles}
                    className="aspect-square rounded-2xl border-2 border-dashed border-brand-border/80 hover:border-brand-primary bg-brand-surface/30 hover:bg-brand-surface/60 flex flex-col items-center justify-center gap-1.5 text-brand-muted hover:text-brand-primary transition-all cursor-pointer active:scale-95 group"
                  >
                    <IconPhoto className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold">+ صور أخرى</span>
                  </button>
                </div>
              )}

              {/* Sub-bar: Upload Status & Secondary URL input toggle */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-brand-border/30">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-bold border border-brand-border/70 flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
                  >
                    <IconUploadCloud className="w-3.5 h-3.5 text-brand-primary" />
                    <span>اختيار صور من الجهاز</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-brand-muted hover:text-brand-primary underline transition-colors cursor-pointer"
                  >
                    {showUrlInput ? 'إخفاء حقل الرابط' : 'أو إضافة رابط صورة من الإنترنت (URL)'}
                  </button>
                </div>

                <div className="text-[10px] text-brand-muted flex items-center gap-1">
                  <IconShieldCheck className="w-3.5 h-3.5 text-brand-trust" />
                  <span>الصور تُحفظ وتُعرض بجودة محسّنة لشبكات غزة</span>
                </div>
              </div>

              {/* Secondary URL Field */}
              {showUrlInput && (
                <div className="p-3 bg-brand-surface/40 rounded-xl border border-brand-border/60 flex items-center gap-2 animate-fadeIn">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="الصق رابط صورة مباشر (https://...)"
                    className="flex-1 h-9 px-3 text-base sm:text-xs rounded-lg border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={!newImageUrl.trim()}
                    className="h-9 px-3.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primary-hover active:scale-95 disabled:opacity-40 cursor-pointer"
                  >
                    إضافة الرابط
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Product Structure Decision (Simple vs Multi-Variant) */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs">
            <h2 className="text-sm font-black text-brand-dark mb-4 pb-3 border-b border-brand-border/40 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                3
              </span>
              <span>نوع الصنف وطبيعة خياراته</span>
            </h2>

            {/* Clear Human-Centric Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div
                onClick={() => setIsSimple(true)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 flex items-start gap-3 select-none ${
                  isSimple
                    ? 'border-brand-primary bg-brand-primary-soft/40 shadow-xs ring-2 ring-brand-primary/20'
                    : 'border-brand-border/70 bg-brand-surface/30 hover:bg-brand-surface'
                }`}
              >
                <div className="mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center border-brand-primary">
                  {isSimple && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                </div>
                <div>
                  <div className="text-xs font-black text-brand-dark">بدون خيارات (سعر ومخزون موحد)</div>
                  <div className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                    الصنف يتوفر بنوع واحد فقط بدون مقاسات أو ألوان (مثل: عسل سدر، ساعة، حقيبة، شال مفرد).
                  </div>
                </div>
              </div>

              <div
                onClick={() => setIsSimple(false)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 flex items-start gap-3 select-none ${
                  !isSimple
                    ? 'border-brand-primary bg-brand-primary-soft/40 shadow-xs ring-2 ring-brand-primary/20'
                    : 'border-brand-border/70 bg-brand-surface/30 hover:bg-brand-surface'
                }`}
              >
                <div className="mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center border-brand-primary">
                  {!isSimple && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                </div>
                <div>
                  <div className="text-xs font-black text-brand-dark">خيارات متعددة (مقاسات أو ألوان)</div>
                  <div className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                    الصنف يتوفر بعدة ألوان أو مقاسات مختلفة (مثل: ملابس، عبايات، أحذية).
                  </div>
                </div>
              </div>
            </div>

            {/* If Simple Product: Instant Clean Form */}
            {isSimple && (
              <div className="mt-4 p-4 rounded-xl bg-brand-surface/40 border border-brand-border/60 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fadeIn">
                <div>
                  <label className="block text-[10px] font-bold text-brand-muted mb-1">
                    سعر البيع (₪) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={simplePrice}
                    onChange={(e) => setSimplePrice(e.target.value)}
                    className="w-full h-10 px-2.5 text-base sm:text-xs font-black rounded-xl border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-muted mb-1">
                    السعر السابق (₪)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={simpleCompareAtPrice}
                    onChange={(e) => setSimpleCompareAtPrice(e.target.value)}
                    placeholder="اختياري"
                    className="w-full h-10 px-2.5 text-base sm:text-xs rounded-xl border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-muted mb-1">
                    الكمية المتوفرة (قطع) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={simpleStock}
                    onChange={(e) => setSimpleStock(e.target.value)}
                    className="w-full h-10 px-2.5 text-base sm:text-xs font-black rounded-xl border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-muted mb-1">
                    رمز SKU
                  </label>
                  <input
                    type="text"
                    value={simpleSku}
                    onChange={(e) => setSimpleSku(e.target.value.toUpperCase())}
                    placeholder="SDM-ITM-01"
                    className="w-full h-10 px-2.5 text-base sm:text-xs font-mono uppercase rounded-xl border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* If Multi-Variant Product: Frictionless, Human-Friendly Flow */}
          {!isSimple && (
            <div className="space-y-6">
              {/* Step 4: Options (Colors & Sizes - Clean Tabular Apple Pattern) */}
              <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-border/50">
                  <div>
                    <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                        4
                      </span>
                      <span>خيارات ومقاسات الصنف</span>
                    </h2>
                    <p className="text-[11px] text-brand-muted mt-0.5">
                      حدد المقاسات أو الألوان. يمكنك تخصيص صورة لكل لون مباشرة بالضغط على مصغرة صورته.
                    </p>
                  </div>

                  {/* Bespoke Apple Add Option Popover */}
                  <div className="relative inline-flex items-center self-start sm:self-auto" data-popover>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddOptionOpen(!isAddOptionOpen);
                        setActiveValuePopoverIdx(null);
                        setActiveColorPhotoPopover(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover active:scale-[0.98] transition-all shadow-xs cursor-pointer"
                    >
                      <IconPlus className="w-3.5 h-3.5 text-white" />
                      <span>إضافة خيار جديد</span>
                      <IconChevronDown
                        className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${
                          isAddOptionOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isAddOptionOpen && (
                      <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-64 max-w-[calc(100vw-2.5rem)] bg-brand-card/95 backdrop-blur-2xl rounded-2xl border border-brand-border shadow-xl p-1.5 z-50 animate-fadeIn space-y-1">
                        {!options.some((o) => o.type === 'COLOR' || o.name === 'اللون') && (
                          <button
                            type="button"
                            onClick={() => {
                              handleAddPredefinedOption('COLOR');
                              setIsAddOptionOpen(false);
                            }}
                            className="w-full p-2.5 rounded-xl hover:bg-brand-surface flex items-start gap-2.5 text-right transition-colors cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                              <IconPalette className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-brand-dark">الألوان (Colors)</div>
                              <div className="text-[10px] text-brand-muted">إضافة ألوان مع ربط صور مخصصة لكل لون</div>
                            </div>
                          </button>
                        )}

                        {!options.some((o) => o.type === 'SIZE' || o.name === 'المقاس') && (
                          <button
                            type="button"
                            onClick={() => {
                              handleAddPredefinedOption('SIZE');
                              setIsAddOptionOpen(false);
                            }}
                            className="w-full p-2.5 rounded-xl hover:bg-brand-surface flex items-start gap-2.5 text-right transition-colors cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-brand-trust/10 text-brand-trust flex items-center justify-center shrink-0 mt-0.5">
                              <IconRuler className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-brand-dark">المقاسات (Sizes)</div>
                              <div className="text-[10px] text-brand-muted">مقاسات ملابس (S, M, L) أو أحذية (38-45)</div>
                            </div>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            handleAddPredefinedOption('CUSTOM');
                            setIsAddOptionOpen(false);
                          }}
                          className="w-full p-2.5 rounded-xl hover:bg-brand-surface flex items-start gap-2.5 text-right transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                            <IconSliders className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-brand-dark">خيار مخصص آخر</div>
                            <div className="text-[10px] text-brand-muted">مثل الحجم، الخامة، أو النوع</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabular Options List (Zero Nested Boxiness, Clean 1px Dividers) */}
                {options.length === 0 ? (
                  <div className="py-8 text-center bg-brand-surface/20 rounded-xl border border-dashed border-brand-border/80 text-xs text-brand-muted">
                    اختر «+ إضافة خيار جديد» أعلاه لتحديد المقاسات أو الألوان
                  </div>
                ) : (
                  <div className="divide-y divide-brand-border/50">
                    {options.map((opt, optIdx) => {
                      const isColor = opt.type === 'COLOR' || opt.name === 'اللون';
                      const isSize = opt.type === 'SIZE' || opt.name === 'المقاس';

                      return (
                        <div
                          key={optIdx}
                          className="py-4 first:pt-1 last:pb-1 flex flex-col md:flex-row md:items-center justify-between gap-3.5"
                        >
                          {/* 1. Fixed Anchor Section: Option Title + Constant Add Popover Button */}
                          <div className="flex flex-wrap items-center gap-3 shrink-0">
                            {/* Option Name & Count Badge */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-brand-dark min-w-14">
                                {opt.name || opt.label}
                              </span>
                              <span className="text-[10px] font-bold text-brand-muted bg-brand-surface px-2 py-0.5 rounded-full border border-brand-border/60">
                                {opt.values.length} {isColor ? 'ألوان' : isSize ? 'مقاسات' : 'قيم'}
                              </span>
                            </div>

                            {/* FIXED ANCHOR: Bespoke Apple Value Popover (Never shifts when values change!) */}
                            <div className="relative inline-flex items-center" data-popover>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveValuePopoverIdx(
                                    activeValuePopoverIdx === optIdx ? null : optIdx
                                  );
                                  setIsAddOptionOpen(false);
                                  setActiveColorPhotoPopover(null);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl border border-brand-primary/40 bg-brand-primary-soft text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-2xs active:scale-[0.98] cursor-pointer group"
                              >
                                <IconPlus className="w-3 h-3 text-brand-primary group-hover:text-white transition-colors" />
                                <span>{isColor ? 'إضافة لون...' : isSize ? 'إضافة مقاس...' : 'إضافة قيمة...'}</span>
                                <IconChevronDown
                                  className={`w-3 h-3 text-brand-primary group-hover:text-white transition-transform duration-200 ${
                                    activeValuePopoverIdx === optIdx ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>

                              {/* Popover Content */}
                              {activeValuePopoverIdx === optIdx && (
                                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] bg-brand-card/95 backdrop-blur-2xl rounded-2xl border border-brand-border shadow-xl p-3 z-50 animate-fadeIn space-y-3">
                                  {isColor && (
                                    <>
                                      <div className="flex items-center justify-between pb-1.5 border-b border-brand-border/40 text-[11px] font-bold text-brand-dark">
                                        <span className="flex items-center gap-1.5">
                                          <IconPalette className="w-3.5 h-3.5 text-brand-primary" />
                                          <span>لوحة الألوان الجاهزة</span>
                                        </span>
                                        <span className="text-[10px] text-brand-muted font-normal">اختر للتضمين فورياً</span>
                                      </div>

                                      <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto no-scrollbar py-0.5">
                                        {Object.entries(COLOR_SWATCHES).map(([colName, swatch]) => {
                                          const isSelected = opt.values.includes(colName);
                                          return (
                                            <button
                                              key={colName}
                                              type="button"
                                              onClick={() => {
                                                if (isSelected) {
                                                  handleRemoveOptionValue(optIdx, colName);
                                                } else {
                                                  handleAddOptionValue(optIdx, colName);
                                                }
                                              }}
                                              className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-right transition-all cursor-pointer active:scale-95 ${
                                                isSelected
                                                  ? 'border-brand-primary bg-brand-primary-soft/50 text-brand-dark font-black shadow-xs'
                                                  : 'border-brand-border/60 hover:bg-brand-surface text-brand-muted hover:text-brand-dark'
                                              }`}
                                            >
                                              <span
                                                className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                                                style={{
                                                  backgroundColor: swatch.hex,
                                                  border: swatch.border ? '1px solid #D1D5DB' : 'none',
                                                }}
                                              />
                                              <span className="text-xs truncate flex-1">{colName}</span>
                                              {isSelected && <IconCheck className="w-3 h-3 text-brand-primary shrink-0" />}
                                            </button>
                                          );
                                        })}
                                      </div>

                                      <div className="pt-2 border-t border-brand-border/40 flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          value={customColorInput}
                                          onChange={(e) => setCustomColorInput(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              if (customColorInput.trim()) {
                                                handleAddOptionValue(optIdx, customColorInput.trim());
                                                setCustomColorInput('');
                                              }
                                            }
                                          }}
                                          placeholder="أو اكتب لوناً مخصصاً (مثال: بترولي)..."
                                          className="flex-1 h-8 px-2.5 text-xs rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (customColorInput.trim()) {
                                              handleAddOptionValue(optIdx, customColorInput.trim());
                                              setCustomColorInput('');
                                            }
                                          }}
                                          disabled={!customColorInput.trim()}
                                          className="h-8 px-3 text-[11px] font-bold bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover active:scale-95 disabled:opacity-40 cursor-pointer"
                                        >
                                          إضافة
                                        </button>
                                      </div>
                                    </>
                                  )}

                                  {isSize && (
                                    <>
                                      <div className="space-y-2">
                                        <div className="text-[11px] font-bold text-brand-dark flex items-center justify-between pb-1 border-b border-brand-border/40">
                                          <span className="flex items-center gap-1">
                                            <IconRuler className="w-3.5 h-3.5 text-brand-primary" />
                                            <span>مقاسات الملابس</span>
                                          </span>
                                          <span className="text-[10px] text-brand-muted font-normal">S إلى 3XL</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {PRESET_CLOTHING_SIZES.map((sz) => {
                                            const isSelected = opt.values.includes(sz);
                                            return (
                                              <button
                                                key={sz}
                                                type="button"
                                                onClick={() => {
                                                  if (isSelected) {
                                                    handleRemoveOptionValue(optIdx, sz);
                                                  } else {
                                                    handleAddOptionValue(optIdx, sz);
                                                  }
                                                }}
                                                className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                                                  isSelected
                                                    ? 'border-brand-primary bg-brand-primary-soft/60 text-brand-dark font-black shadow-xs'
                                                    : 'border-brand-border/70 hover:bg-brand-surface text-brand-dark'
                                                }`}
                                              >
                                                <span>{sz}</span>
                                                {isSelected && <IconCheck className="w-2.5 h-2.5 text-brand-primary" />}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      <div className="space-y-2 pt-1">
                                        <div className="text-[11px] font-bold text-brand-dark flex items-center justify-between pb-1 border-b border-brand-border/40">
                                          <span>مقاسات الأحذية</span>
                                          <span className="text-[10px] text-brand-muted font-normal">38 إلى 45</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {['38', ...PRESET_SHOE_SIZES].map((sz) => {
                                            const isSelected = opt.values.includes(sz);
                                            return (
                                              <button
                                                key={sz}
                                                type="button"
                                                onClick={() => {
                                                  if (isSelected) {
                                                    handleRemoveOptionValue(optIdx, sz);
                                                  } else {
                                                    handleAddOptionValue(optIdx, sz);
                                                  }
                                                }}
                                                className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                                                  isSelected
                                                    ? 'border-brand-primary bg-brand-primary-soft/60 text-brand-dark font-black shadow-xs'
                                                    : 'border-brand-border/70 hover:bg-brand-surface text-brand-dark'
                                                }`}
                                              >
                                                <span>{sz}</span>
                                                {isSelected && <IconCheck className="w-2.5 h-2.5 text-brand-primary" />}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      <div className="pt-2 border-t border-brand-border/40 flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          value={customSizeInput}
                                          onChange={(e) => setCustomSizeInput(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              if (customSizeInput.trim()) {
                                                handleAddOptionValue(optIdx, customSizeInput.trim());
                                                setCustomSizeInput('');
                                              }
                                            }
                                          }}
                                          placeholder="أو اكتب مقاساً مخصصاً (مثال: 4XL أو 100ml)..."
                                          className="flex-1 h-8 px-2.5 text-xs rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (customSizeInput.trim()) {
                                              handleAddOptionValue(optIdx, customSizeInput.trim());
                                              setCustomSizeInput('');
                                            }
                                          }}
                                          disabled={!customSizeInput.trim()}
                                          className="h-8 px-3 text-[11px] font-bold bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover active:scale-95 disabled:opacity-40 cursor-pointer"
                                        >
                                          إضافة
                                        </button>
                                      </div>
                                    </>
                                  )}

                                  {!isColor && !isSize && (
                                    <div className="space-y-2.5">
                                      <div className="text-[11px] font-bold text-brand-dark pb-1 border-b border-brand-border/40">
                                        إضافة قيمة لهذا الخيار
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          autoFocus
                                          value={customSizeInput}
                                          onChange={(e) => setCustomSizeInput(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              if (customSizeInput.trim()) {
                                                handleAddOptionValue(optIdx, customSizeInput.trim());
                                                setCustomSizeInput('');
                                              }
                                            }
                                          }}
                                          placeholder="اكتب القيمة..."
                                          className="flex-1 h-8 px-2.5 text-xs rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (customSizeInput.trim()) {
                                              handleAddOptionValue(optIdx, customSizeInput.trim());
                                              setCustomSizeInput('');
                                            }
                                          }}
                                          disabled={!customSizeInput.trim()}
                                          className="h-8 px-3 text-[11px] font-bold bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover active:scale-95 disabled:opacity-40 cursor-pointer"
                                        >
                                          إضافة
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 2. Middle Section: Selected Values Tags (Grow and wrap freely without moving the button) */}
                          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                            {opt.values.length === 0 ? (
                              <span className="text-[11px] text-brand-muted/70 italic">
                                لم يتم تحديد أي {isColor ? 'ألوان' : isSize ? 'مقاسات' : 'قيم'} بعد.
                              </span>
                            ) : (
                              opt.values.map((val) => {
                                const boundImg = isColor ? colorImageMap[val] || images[0] : null;

                                return (
                                  <div
                                    key={val}
                                    className="inline-flex items-center gap-1.5 bg-brand-surface/70 hover:bg-brand-surface text-brand-dark pr-2 pl-2.5 py-1 rounded-xl border border-brand-border/70 text-xs font-bold transition-all shadow-2xs group"
                                  >
                                    {/* Color image custom popover thumbnail */}
                                    {isColor && (
                                      <div className="relative inline-flex items-center" data-popover>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveColorPhotoPopover(
                                              activeColorPhotoPopover === val ? null : val
                                            );
                                            setIsAddOptionOpen(false);
                                            setActiveValuePopoverIdx(null);
                                          }}
                                          className="relative w-5 h-5 rounded-md overflow-hidden border border-brand-border/80 shrink-0 hover:scale-110 transition-transform cursor-pointer shadow-2xs group/thumb"
                                          title={`تغيير صورة هذا اللون: ${val}`}
                                        >
                                          <img
                                            src={boundImg || primaryImage}
                                            alt={val}
                                            className="w-full h-full object-cover"
                                          />
                                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                            <IconPhoto className="w-3 h-3 text-white" />
                                          </div>
                                        </button>

                                        {/* Color Photo Picker Popover */}
                                        {activeColorPhotoPopover === val && (
                                          <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2.5rem)] bg-brand-card/95 backdrop-blur-2xl rounded-2xl border border-brand-border shadow-xl p-3 z-50 animate-fadeIn space-y-2.5">
                                            <div className="flex items-center justify-between pb-1.5 border-b border-brand-border/40 text-[11px] font-bold text-brand-dark">
                                              <span className="flex items-center gap-1">
                                                <IconPhoto className="w-3.5 h-3.5 text-brand-primary" />
                                                <span>صورة لون «{val}»</span>
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => setActiveColorPhotoPopover(null)}
                                                className="text-brand-muted hover:text-brand-dark cursor-pointer"
                                              >
                                                <IconX className="w-3.5 h-3.5" />
                                              </button>
                                            </div>

                                            {images.length === 0 ? (
                                              <div className="py-4 text-center text-[11px] text-brand-muted">
                                                لا توجد صور في المعرض بعد. أضف صوراً في الخطوة 2 أولاً.
                                              </div>
                                            ) : (
                                              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto no-scrollbar py-1">
                                                {images.map((imgUrl, imgI) => {
                                                  const isAssigned =
                                                    colorImageMap[val] === imgUrl ||
                                                    (!colorImageMap[val] && imgI === 0);
                                                  return (
                                                    <button
                                                      key={imgI}
                                                      type="button"
                                                      onClick={() => {
                                                        handleBindColorImage(val, imgUrl);
                                                        setActiveColorPhotoPopover(null);
                                                      }}
                                                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group/item ${
                                                        isAssigned
                                                          ? 'border-brand-primary ring-2 ring-brand-primary/20 shadow-xs'
                                                          : 'border-brand-border/70 hover:border-brand-primary/50'
                                                      }`}
                                                    >
                                                      <img
                                                        src={imgUrl}
                                                        alt={`صورة ${imgI + 1}`}
                                                        className="w-full h-full object-cover"
                                                      />
                                                      {isAssigned && (
                                                        <div className="absolute inset-0 bg-brand-primary/25 flex items-center justify-center">
                                                          <span className="w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-xs">
                                                            <IconCheck className="w-3 h-3" />
                                                          </span>
                                                        </div>
                                                      )}
                                                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1 rounded">
                                                        {imgI === 0 ? 'الغلاف' : `#${imgI + 1}`}
                                                      </span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            )}

                                            {colorImageMap[val] && (
                                              <div className="pt-1.5 border-t border-brand-border/40">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const nextMap = { ...colorImageMap };
                                                    delete nextMap[val];
                                                    setColorImageMap(nextMap);
                                                    setActiveColorPhotoPopover(null);
                                                  }}
                                                  className="w-full py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-center"
                                                >
                                                  إلغاء التخصيص (استخدام الغلاف)
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <span>{val}</span>

                                    {/* Delete Pill Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOptionValue(optIdx, val)}
                                      className="text-brand-muted hover:text-red-600 transition-colors cursor-pointer text-xs leading-none mr-0.5"
                                      title="إزالة هذه القيمة"
                                    >
                                      <IconX className="w-3 h-3" />
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* 3. Left side: Delete Option Action */}
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(optIdx)}
                            className="text-xs text-brand-muted hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1 shrink-0 self-end md:self-auto py-1"
                            title="إزالة هذا الخيار بالكامل"
                          >
                            <IconTrash className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">إزالة الخيار</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 5: Generated Combinations List (Clean Tabular Layout) */}
              <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs space-y-4">
                <div className="pb-3 border-b border-brand-border/40">
                  <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                      5
                    </span>
                    <span>قائمة المقاسات والأصناف المتوفرة ({variants.length})</span>
                  </h2>
                  <p className="text-[11px] text-brand-muted mt-0.5">
                    تتولد التوليفات تلقائياً من الخيارات المحددة. يمكنك توحيد الأسعار والكميات بنقرة واحدة، أو تعديل كل مقاس بشكل منفصل.
                  </p>
                </div>

                {/* Prominent Fast Bulk Operations Banner (Unmissable, High Contrast & Tactile) */}
                {variants.length > 0 && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-brand-surface/70 border border-brand-primary/25 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 text-brand-dark">
                        <span className="w-6 h-6 rounded-lg bg-brand-primary/15 text-brand-primary flex items-center justify-center shrink-0">
                          <IconSpark className="w-3.5 h-3.5 text-brand-primary" />
                        </span>
                        <span className="text-xs font-black text-brand-dark">
                          لوحة الإجراءات السريعة (تطبيق موحد على جميع الأصناف الـ {variants.length})
                        </span>
                      </div>
                      <span className="text-[11px] text-brand-muted font-medium">
                        وفر وقتك: حدد سعراً أو مخزوناً ليتم تطبيقه فورياً على كافة التوليفات
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Bulk Price Capsule */}
                      <div className="flex items-center gap-2 bg-brand-card p-1.5 pr-3 rounded-xl border border-brand-border/80 shadow-2xs">
                        <span className="text-xs font-black text-brand-muted shrink-0">السعر الموحد:</span>
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <span className="text-xs font-bold text-brand-primary">₪</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="مثال: 45"
                            value={bulkPriceInput}
                            onChange={(e) => setBulkPriceInput(e.target.value)}
                            className="w-full h-8 text-xs font-black text-brand-dark bg-transparent focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyBulkPrice}
                          disabled={!bulkPriceInput}
                          className="px-3.5 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primary-hover active:scale-95 transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-2xs"
                        >
                          تطبيق على الكل
                        </button>
                      </div>

                      {/* Bulk Stock Capsule */}
                      <div className="flex items-center gap-2 bg-brand-card p-1.5 pr-3 rounded-xl border border-brand-border/80 shadow-2xs">
                        <span className="text-xs font-black text-brand-muted shrink-0">المخزون الموحد:</span>
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <IconPackage className="w-3.5 h-3.5 text-brand-trust shrink-0" />
                          <input
                            type="number"
                            min="0"
                            placeholder="مثال: 12"
                            value={bulkStockInput}
                            onChange={(e) => setBulkStockInput(e.target.value)}
                            className="w-full h-8 text-xs font-black text-brand-dark bg-transparent focus:outline-none px-1"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyBulkStock}
                          disabled={!bulkStockInput}
                          className="px-3.5 py-1.5 bg-brand-trust text-white text-xs font-bold rounded-lg hover:bg-brand-trust/90 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-2xs"
                        >
                          تطبيق على الكل
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Streamlined Variants Table / List */}
                {variants.length === 0 ? (
                  <div className="text-center py-8 bg-brand-surface/30 rounded-xl border border-dashed border-brand-border/80 text-xs text-brand-muted">
                    أضف قيم المقاسات أو الألوان في الخطوة 4 أعلاه لتوليد القائمة فورياً
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Table Header (Desktop Only) */}
                    <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-2 text-[11px] font-black text-brand-muted border-b border-brand-border/40">
                      <div className="col-span-4">الصنف والتوليفة</div>
                      <div className="col-span-3">رمز SKU</div>
                      <div className="col-span-2">سعر البيع</div>
                      <div className="col-span-2">المخزون بالمستودع</div>
                      <div className="col-span-1 text-center">الإجراء</div>
                    </div>

                    {/* Variants Rows */}
                    <div className="divide-y divide-brand-border/40 space-y-2 md:space-y-0">
                      {variants.map((v, vIdx) => {
                        const attrEntries = Object.entries(v.attributes || {});
                        const attrSummary = attrEntries.map(([_, val]) => val).join(' · ') || 'افتراضي';
                        const variantPhoto = v.images && v.images.length > 0 ? v.images[0] : primaryImage;

                        return (
                          <div
                            key={v.attrKey || vIdx}
                            className={`p-3 md:py-2.5 md:px-3 rounded-xl md:rounded-none transition-all ${
                              v.isActive
                                ? 'bg-brand-surface/20 md:bg-transparent hover:bg-brand-surface/40'
                                : 'bg-zinc-50/70 md:bg-zinc-50/40 opacity-60'
                            }`}
                          >
                            {/* Desktop Grid Row */}
                            <div className="hidden md:grid grid-cols-12 items-center gap-3">
                              {/* Col 1-4: Thumbnail & Attributes */}
                              <div className="col-span-4 flex items-center gap-2.5">
                                <img
                                  src={variantPhoto}
                                  alt={attrSummary}
                                  className="w-9 h-9 rounded-xl object-cover border border-brand-border/70 shrink-0 bg-brand-surface shadow-2xs"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-black text-brand-dark truncate">{attrSummary}</div>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {attrEntries.map(([key, val]) => (
                                      <span
                                        key={key}
                                        className="inline-flex items-center text-[10px] text-brand-muted bg-brand-surface px-1.5 py-0.2 rounded border border-brand-border/50"
                                      >
                                        {val}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Col 5-7: SKU */}
                              <div className="col-span-3">
                                <span className="font-mono text-[10px] text-brand-muted bg-brand-surface px-2 py-0.5 rounded-md border border-brand-border/60">
                                  {v.sku}
                                </span>
                              </div>

                              {/* Col 8-9: Price */}
                              <div className="col-span-2">
                                <div className="relative inline-flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={v.price}
                                    onChange={(e) => {
                                      const updated = [...variants];
                                      updated[vIdx] = { ...v, price: Number(e.target.value) || 0 };
                                      setVariants(updated);
                                    }}
                                    className="w-20 h-8 pr-2 pl-5 text-xs font-black rounded-lg border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                                  />
                                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-muted pointer-events-none">
                                    ₪
                                  </span>
                                </div>
                              </div>

                              {/* Col 10-11: Stepper */}
                              <div className="col-span-2">
                                <div className="inline-flex items-center h-8 bg-brand-card rounded-lg border border-brand-border/70 px-1 shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...variants];
                                      updated[vIdx] = { ...v, stock: Math.max(0, v.stock - 1) };
                                      setVariants(updated);
                                    }}
                                    className="w-5 h-5 rounded bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={v.stock}
                                    onChange={(e) => {
                                      const updated = [...variants];
                                      updated[vIdx] = {
                                        ...v,
                                        stock: Math.max(0, parseInt(e.target.value) || 0),
                                      };
                                      setVariants(updated);
                                    }}
                                    className="w-9 text-center font-black text-xs bg-transparent focus:outline-none tabular-nums"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...variants];
                                      updated[vIdx] = { ...v, stock: v.stock + 1 };
                                      setVariants(updated);
                                    }}
                                    className="w-5 h-5 rounded bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* Col 12: Actions (Tactile Active Switch + Trash) */}
                              <div className="col-span-1 flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={v.isActive}
                                  onClick={() => {
                                    const updated = [...variants];
                                    updated[vIdx] = { ...v, isActive: !v.isActive };
                                    setVariants(updated);
                                  }}
                                  className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    v.isActive ? 'bg-brand-trust' : 'bg-brand-border'
                                  }`}
                                  title={v.isActive ? 'نشط ومتاح للطلب - انقر للتعطيل' : 'معطل مؤقتاً - انقر للتفعيل'}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                      v.isActive ? '-translate-x-3.5' : 'translate-x-0'
                                    }`}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletedVariantKeys((prev) => [...prev, v.attrKey]);
                                    setVariants((prev) => prev.filter((_, idx) => idx !== vIdx));
                                  }}
                                  className="text-brand-muted hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="حذف هذا الصنف المحدد"
                                >
                                  <IconTrash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Mobile Responsive Layout */}
                            <div className="md:hidden space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={variantPhoto}
                                    alt={attrSummary}
                                    className="w-10 h-10 rounded-xl object-cover border border-brand-border/70 shrink-0 bg-brand-surface shadow-2xs"
                                  />
                                  <div>
                                    <div className="text-xs font-black text-brand-dark">{attrSummary}</div>
                                    <div className="text-[10px] text-brand-muted font-mono">{v.sku}</div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={v.isActive}
                                    onClick={() => {
                                      const updated = [...variants];
                                      updated[vIdx] = { ...v, isActive: !v.isActive };
                                      setVariants(updated);
                                    }}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      v.isActive ? 'bg-brand-trust' : 'bg-brand-border'
                                    }`}
                                    title={v.isActive ? 'نشط ومتاح للطلب - انقر للتعطيل' : 'معطل مؤقتاً - انقر للتفعيل'}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                        v.isActive ? '-translate-x-4' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeletedVariantKeys((prev) => [...prev, v.attrKey]);
                                      setVariants((prev) => prev.filter((_, idx) => idx !== vIdx));
                                    }}
                                    className="text-brand-muted hover:text-red-600 p-1 cursor-pointer"
                                    title="حذف الصنف"
                                  >
                                    <IconTrash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-brand-border/30">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-brand-muted font-bold">السعر:</span>
                                  <div className="relative inline-flex items-center">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={v.price}
                                      onChange={(e) => {
                                        const updated = [...variants];
                                        updated[vIdx] = { ...v, price: Number(e.target.value) || 0 };
                                        setVariants(updated);
                                      }}
                                      className="w-20 h-8 pr-2 pl-4 text-xs font-black rounded-lg border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                                    />
                                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-brand-muted pointer-events-none">
                                      ₪
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-brand-muted font-bold">المخزون:</span>
                                  <div className="inline-flex items-center h-8 bg-brand-card rounded-lg border border-brand-border/70 px-1 shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...variants];
                                        updated[vIdx] = { ...v, stock: Math.max(0, v.stock - 1) };
                                        setVariants(updated);
                                      }}
                                      className="w-6 h-6 rounded bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      value={v.stock}
                                      onChange={(e) => {
                                        const updated = [...variants];
                                        updated[vIdx] = {
                                          ...v,
                                          stock: Math.max(0, parseInt(e.target.value) || 0),
                                        };
                                        setVariants(updated);
                                      }}
                                      className="w-10 text-center font-black text-xs bg-transparent focus:outline-none tabular-nums"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...variants];
                                        updated[vIdx] = { ...v, stock: v.stock + 1 };
                                        setVariants(updated);
                                      }}
                                      className="w-6 h-6 rounded bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SETTINGS (Apple-Grade Quiet Luxury & Full Width)   */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fadeIn w-full">
          {/* 1. Storefront Visibility & Live State */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-brand-border/40">
              <span className="w-8 h-8 rounded-xl bg-brand-surface border border-brand-border/70 flex items-center justify-center text-brand-dark">
                <IconEye className="w-4 h-4 text-brand-primary" />
              </span>
              <div>
                <h2 className="text-sm font-black text-brand-dark">حالة العرض في متجر سَدِيم</h2>
                <p className="text-[11px] text-brand-muted mt-0.5">
                  تحكم فوري في ظهور الصنف للزبائن في المحافظة الوسطى
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-brand-surface/40 border border-brand-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isActive ? 'bg-brand-trust shadow-xs animate-pulse' : 'bg-brand-muted/60'
                    }`}
                  />
                  <span className="text-xs font-black text-brand-dark">
                    {isActive ? 'الصنف معروض ونشط بالمتجر' : 'الصنف مخفي مؤقتاً عن الزبائن'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-brand-trust-soft text-brand-trust border-brand-trust/30'
                        : 'bg-brand-card text-brand-muted border-brand-border/70'
                    }`}
                  >
                    {isActive ? 'متاح للطلب' : 'مسودة غير معروضة'}
                  </span>
                </div>
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  {isActive
                    ? 'الصنف ظاهر لزبائن دير البلح والنصيرات ومتاح للإضافة للسلة الموحدة والمعاينة عند الباب.'
                    : 'الصنف محجوب تماماً عن واجهة المتجر دون حذف بياناته أو كميات مخزونه. يمكنك إعادة تنشيطه بأي وقت.'}
                </p>
              </div>

              {/* iOS-Style Tactile Toggle Switch */}
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-start sm:self-center ${
                  isActive ? 'bg-brand-trust' : 'bg-brand-border'
                }`}
                role="switch"
                aria-checked={isActive}
                title={isActive ? 'تعطيل وإخفاء الصنف' : 'تفعيل وإظهار الصنف'}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isActive ? '-translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 2. Anonymous / White-label Vendor Supply (New Dedicated Feature) */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-brand-border/40">
              <span className="w-8 h-8 rounded-xl bg-brand-surface border border-brand-border/70 flex items-center justify-center text-brand-dark">
                <IconEyeOff className="w-4 h-4 text-brand-primary" />
              </span>
              <div>
                <h2 className="text-sm font-black text-brand-dark">
                  عرض الصنف كجهة مجهولة / إخفاء هوية المتجر
                </h2>
                <p className="text-[11px] text-brand-muted mt-0.5">
                  توريد الصنف كمنتج مباشر من سَدِيم دون الكشف عن اسم أو بيانات متجرك للزبائن
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-brand-surface/40 border border-brand-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isAnonymousVendor ? 'bg-brand-primary shadow-xs animate-pulse' : 'bg-brand-muted/60'
                    }`}
                  />
                  <span className="text-xs font-black text-brand-dark">
                    {isAnonymousVendor
                      ? 'توريد مباشر من سَدِيم (هوية المتجر مخفية بالكامل)'
                      : 'عرض اعتيادي (مرتبط باسم متجرك المعتمد)'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isAnonymousVendor
                        ? 'bg-brand-primary-soft text-brand-primary border-brand-primary-border'
                        : 'bg-brand-card text-brand-muted border-brand-border/70'
                    }`}
                  >
                    {isAnonymousVendor ? 'مفعل' : 'معطل'}
                  </span>
                </div>
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  عند تفعيل هذا الخيار:
                  <span className="block mt-1 font-bold text-brand-dark">
                    1. يُحجب الصنف نهائياً من الظهور في صفحة متجرك العام للزبائن.
                  </span>
                  <span className="block mt-0.5 font-bold text-brand-dark">
                    2. في صفحة تفاصيل المنتج (PDP)، يُخفى اسم وشعار متجرك ويُعرض كـ «توريد مباشر وموثق عبر سَدِيم» مع بقاء أرباحك ومستحقاتك محفوظة لك بالكامل.
                  </span>
                </p>
              </div>

              {/* iOS-Style Tactile Toggle Switch */}
              <button
                type="button"
                onClick={() => setIsAnonymousVendor(!isAnonymousVendor)}
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-start sm:self-center ${
                  isAnonymousVendor ? 'bg-brand-primary' : 'bg-brand-border'
                }`}
                role="switch"
                aria-checked={isAnonymousVendor}
                title={isAnonymousVendor ? 'إلغاء وضع التوريد المجهول' : 'تفعيل إخفاء هوية المتجر'}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isAnonymousVendor ? '-translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isAnonymousVendor && (
              <div className="p-3.5 rounded-xl bg-brand-primary-soft/60 border border-brand-primary-border/80 flex items-center gap-2.5 text-xs text-brand-dark animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
                <span className="font-extrabold text-brand-dark">حالة التوريد:</span>
                <span className="text-brand-muted text-[11px]">
                  الصنف محمي؛ لن يظهر في صفحة متجرك، والزبون يراه في المتجر العام كمنتج مورد مباشرة عبر سَدِيم المركزي.
                </span>
              </div>
            )}
          </div>

          {/* 3. Sensitive Danger Zone (Apple-Grade Quiet Restraint) */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-red-200/60 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-red-100">
              <span className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                <IconAlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-red-800">الإجراءات الحساسة وحذف الصنف</h2>
                <p className="text-[11px] text-red-700/70 mt-0.5">
                  إزالة الصنف نهائياً من قاعدة بيانات المتجر
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-50/40 border border-red-100">
              <p className="text-xs text-brand-muted leading-relaxed flex-1">
                عند حذف هذا الصنف، سيتم إزالته من المتجر نهائياً. في حال ارتباطه بطلبات سابقة تم تسليمها، ستحتفظ سجلات سَدِيم بالفواتير التاريخية لضمان حقوق الزبائن والمستحقات المالية.
              </p>
              <button
                type="button"
                onClick={handleDeleteProduct}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-700 bg-white hover:bg-red-50 border border-red-200 shadow-2xs hover:border-red-300 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <IconTrash className="w-3.5 h-3.5 text-red-600" />
                <span>حذف الصنف من المتجر</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. STICKY BOTTOM SAVE ACTION BAR (Apple Material Dock)    */}
      {/* Rendered on both Editor and Settings tabs, thumb-friendly */}
      {/* ========================================================= */}
      {(activeTab === 'editor' || activeTab === 'settings') && (
        <div className="fixed bottom-0 left-0 right-0 lg:right-68 z-40 bg-brand-card/95 backdrop-blur-xl border-t border-brand-border/70 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-xl font-almarai">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-brand-muted">
              <span>الصنف:</span>
              <span className="font-bold text-brand-dark">{name || 'بدون اسم'}</span>
              <span>•</span>
              <span>{variantsCount} أصناف</span>
              <span>•</span>
              <span className="font-bold text-brand-trust">{totalStock} قطعة بالمخزون</span>
              {isAnonymousVendor && (
                <>
                  <span>•</span>
                  <span className="text-zinc-600 font-bold bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">
                    توريد مباشر
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2.5 rounded-xl border border-brand-border/80 text-brand-dark text-xs font-bold hover:bg-brand-surface active:scale-[0.97] transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={isSaving}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover active:scale-[0.97] shadow-xs transition-transform duration-100 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSaving && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>حفظ التعديلات في المتجر</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
