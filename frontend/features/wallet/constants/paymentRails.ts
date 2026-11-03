/**
 * قنوات ومزودو الدفع والتحويل المالي المعتمدة في قطاع غزة
 */

export type PaymentRailId = 'JAWWAL_PAY' | 'PAL_PAY' | 'BANK_OF_PALESTINE' | 'PALESTINE_ISLAMIC_BANK';

export interface PaymentRailTheme {
  primary: string;
  primaryHover: string;
  bgSoft: string;
  borderSoft: string;
  borderActive: string;
  badgeBg: string;
  badgeText: string;
  monogram: string;
  appHint: string;
}

export interface PaymentRailConfig {
  id: PaymentRailId;
  name: string;
  shortName: string;
  type: 'wallet' | 'bank';
  badge: string;
  depositAccount: string;
  depositIban?: string;
  depositAccountHolder: string;
  depositInstruction: string;
  processingTime: string;
  accountLabel: string;
  accountPlaceholder: string;
  iconType: 'jawwal' | 'palpay' | 'bop' | 'pib';
  theme: PaymentRailTheme;
}

export const PAYMENT_RAILS: Record<PaymentRailId, PaymentRailConfig> = {
  JAWWAL_PAY: {
    id: 'JAWWAL_PAY',
    name: 'محفظة جوال باي (Jawwal Pay)',
    shortName: 'جوال باي',
    type: 'wallet',
    badge: 'حوالة محفظة فورية',
    depositAccount: '0599123456',
    depositAccountHolder: 'سَدِيم للخدمات اللوجستية والتجارة',
    depositInstruction: 'افتح تطبيق جوال باي، اختر تحويل أموال لرقم المحفظة أعلاه، وأرفق لقطة شاشة لإشعار العملية.',
    processingTime: 'اعتماد فوري خلال ساعات الدوام',
    accountLabel: 'رقم محفظة جوال باي (059)',
    accountPlaceholder: 'مثال: 0599123456',
    iconType: 'jawwal',
    theme: {
      primary: '#58B947',
      primaryHover: '#479C38',
      bgSoft: '#F4FBF2',
      borderSoft: '#D7F3CE',
      borderActive: '#58B947',
      badgeBg: '#EBF8E7',
      badgeText: '#36792A',
      monogram: 'JP',
      appHint: 'تطبيق جوال باي (Jawwal Pay)',
    },
  },
  PAL_PAY: {
    id: 'PAL_PAY',
    name: 'محفظة بال باي (PalPay - محفظتي)',
    shortName: 'بال باي',
    type: 'wallet',
    badge: 'محفظة ونقاط بيع معتمدة',
    depositAccount: '0598889900',
    depositAccountHolder: 'متجر سَدِيم التجاري',
    depositInstruction: 'قم بالتحويل عبر تطبيق محفظتي أو أحد وكلاء بال باي المعتمدين في الوسطى مع إرفاق الإشعار.',
    processingTime: 'اعتماد فوري خلال ساعات الدوام',
    accountLabel: 'رقم محفظة أو هاتف بال باي',
    accountPlaceholder: 'مثال: 0598889900',
    iconType: 'palpay',
    theme: {
      primary: '#702082',
      primaryHover: '#5C1A6B',
      bgSoft: '#FAF5FC',
      borderSoft: '#F0DCF5',
      borderActive: '#702082',
      badgeBg: '#F5E8FA',
      badgeText: '#702082',
      monogram: 'PP',
      appHint: 'تطبيق محفظتي (PalPay)',
    },
  },
  BANK_OF_PALESTINE: {
    id: 'BANK_OF_PALESTINE',
    name: 'بنك فلسطين (Bank of Palestine)',
    shortName: 'بنك فلسطين',
    type: 'bank',
    badge: 'حوالة داخلية / تطبيق بانت',
    depositAccount: '1234567/001',
    depositIban: 'PS92PALS00000000001234567001',
    depositAccountHolder: 'شركة سَدِيم للتجارة الإلكترونية',
    depositInstruction: 'قم بالتحويل الداخلي عبر تطبيق بانت أو الفرع لرقم الحساب، واحتفظ بإشعار الحوالة لتأكيد الإيداع.',
    processingTime: 'خلال 24 ساعة عمل',
    accountLabel: 'رقم الحساب البنكي أو الآيبان (IBAN)',
    accountPlaceholder: 'مثال: 1234567/001',
    iconType: 'bop',
    theme: {
      primary: '#A61955',
      primaryHover: '#871344',
      bgSoft: '#FDF2F7',
      borderSoft: '#FCE7F0',
      borderActive: '#A61955',
      badgeBg: '#FCE7F0',
      badgeText: '#A61955',
      monogram: 'BOP',
      appHint: 'تطبيق بانت (Banki) أونلاين',
    },
  },
  PALESTINE_ISLAMIC_BANK: {
    id: 'PALESTINE_ISLAMIC_BANK',
    name: 'البنك الإسلامي الفلسطيني (PIB)',
    shortName: 'الإسلامي الفلسطيني',
    type: 'bank',
    badge: 'حوالة إسلامي موبايل',
    depositAccount: '7654321',
    depositIban: 'PS18ISBK00000000007654321001',
    depositAccountHolder: 'سَدِيم للتجارة والتوزيع',
    depositInstruction: 'قم بالتحويل عبر تطبيق إسلامي موبايل إلى رقم الحساب أعلاه، وأرفق صورة إشعار الحوالة.',
    processingTime: 'خلال 24 ساعة عمل',
    accountLabel: 'رقم الحساب البنكي',
    accountPlaceholder: 'مثال: 7654321',
    iconType: 'pib',
    theme: {
      primary: '#F59E0B',
      primaryHover: '#D97706',
      bgSoft: '#FFFBEB',
      borderSoft: '#FEF3C7',
      borderActive: '#F59E0B',
      badgeBg: '#173059',
      badgeText: '#FFFFFF',
      monogram: 'PIB',
      appHint: 'تطبيق إسلامي موبايل (PIB)',
    },
  },
};

export const PAYMENT_RAILS_LIST: PaymentRailConfig[] = Object.values(PAYMENT_RAILS);
