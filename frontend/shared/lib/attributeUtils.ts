/**
 * أداة استخراج خصائص المتغيرات من بيانات قاعدة البيانات مباشرة (Category Attributes Helper)
 * لا تحتوي على أي بيانات وهمية أو قواميس ثابتة - تعتمد 100% على كائن الفئة القادم من MongoDB
 */

export interface AttributeLike {
  key?: string;
  name: string;
  values?: string[];
  type?: string;
}

/**
 * استخراج المفتاح التقني القادم من قاعدة البيانات
 * إن وُجد key نستخدمه، وإن لم يوجد نستخدم name كما هو من قاعدة البيانات
 */
export function getAttributeKey(attr: AttributeLike | string): string {
  if (typeof attr === 'string') {
    return attr.trim();
  }
  return (attr.key && attr.key.trim()) || (attr.name && attr.name.trim()) || '';
}

/**
 * استخراج الاسم المعروض للمستخدم القادم من قاعدة البيانات
 * إن وُجد name نستخدمه كما هو من قاعدة البيانات
 */
export function getAttributeDisplayName(attr: AttributeLike | string): string {
  if (typeof attr === 'string') {
    return attr.trim();
  }
  return (attr.name && attr.name.trim()) || (attr.key && attr.key.trim()) || '';
}

/**
 * فحص ما إذا كانت الخاصية لوناً لعرض الدائرة اللونية (بناءً على الاسم القادم من DB)
 */
export function isColorAttribute(keyOrName: string): boolean {
  const norm = (keyOrName || '').trim().toLowerCase();
  return norm.includes('لون') || norm.includes('color');
}

/**
 * فحص ما إذا كانت الخاصية مقاساً لعرض دليل المقاسات إن لزم (بناءً على الاسم القادم من DB)
 */
export function isSizeAttribute(keyOrName: string): boolean {
  const norm = (keyOrName || '').trim().toLowerCase();
  return norm.includes('مقاس') || norm.includes('size');
}
