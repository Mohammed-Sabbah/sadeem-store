export interface CategoryAttributeDraft {
  name: string;
  key: string;
  type: 'String' | 'Number' | 'Boolean';
  values: string[];
}

export function cleanAttributeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, '_')
    .replace(/[.$]/g, '');
}

export function validateCategoryDraft(
  title: string,
  attributes: CategoryAttributeDraft[]
): { isValid: boolean; error?: string } {
  const trimmedTitle = (title || '').trim();
  if (!trimmedTitle) {
    return { isValid: false, error: 'اسم الفئة مطلوب' };
  }
  if (trimmedTitle.length < 2 || trimmedTitle.length > 100) {
    return { isValid: false, error: 'اسم الفئة يجب أن يكون بين حرفين و 100 حرف' };
  }

  const keys = new Set<string>();
  for (const attr of attributes) {
    if (!attr.name.trim()) {
      return { isValid: false, error: 'اسم الخاصية مطلوب لجميع الخصائص' };
    }
    const cleanKey = cleanAttributeKey(attr.key || attr.name);
    if (!cleanKey) {
      return { isValid: false, error: 'مفتاح الخاصية يجب أن يحتوي على أحرف إنجليزية صالحة' };
    }
    if (keys.has(cleanKey)) {
      return { isValid: false, error: `مفتاح الخاصية «${cleanKey}» مكرر في الفئة` };
    }
    keys.add(cleanKey);
  }

  return { isValid: true };
}
