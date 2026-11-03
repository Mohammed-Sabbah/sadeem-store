/**
 * أدوات ضغط إيصالات التحويل المالي ومعاينتها محلياً داخل المتصفح
 * مصممة خصيصاً لظروف الاتصال الضعيف في قطاع غزة مع الحفاظ التام على دقة ووضوح الأرقام
 */

export interface CompressionResult {
  file: File;
  previewUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savedPercentage: number;
  width: number;
  height: number;
}

export interface DimensionCalculation {
  width: number;
  height: number;
}

/**
 * حساب الأبعاد المتناسبة مع حصر البعد الأكبر عند الحد الأقصى
 */
export function calculateTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number = 1600
): DimensionCalculation {
  if (originalWidth <= 0 || originalHeight <= 0) {
    return { width: maxDimension, height: maxDimension };
  }

  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight };
  }

  if (originalWidth >= originalHeight) {
    const ratio = maxDimension / originalWidth;
    return {
      width: maxDimension,
      height: Math.round(originalHeight * ratio),
    };
  }

  const ratio = maxDimension / originalHeight;
  return {
    width: Math.round(originalWidth * ratio),
    height: maxDimension,
  };
}

/**
 * تنسيق حجم الملف بالكيلوبايت أو الميجابايت بدقة مقروءة
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 ك.ب';
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} ك.ب`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} م.ب`;
}

/**
 * ضغط صورة الإشعار المالي عبر Canvas في المتصفح مع الحفاظ على وضوح النصوص والأرقام
 */
export async function compressReceiptImage(
  file: File,
  options: {
    maxDimension?: number;
    quality?: number;
  } = {}
): Promise<CompressionResult> {
  const maxDimension = options.maxDimension ?? 1600;
  const quality = options.quality ?? 0.82;

  // إذا لم يكن الملف صورة صالحة، يرمى استثناء واضح
  if (!file.type.startsWith('image/')) {
    throw new Error('الملف المحدد ليس صورة صالحة. يرجى اختيار صورة إيصال التحويل (PNG أو JPG).');
  }

  const originalSizeBytes = file.size;

  // في البيئات التي لا تدعم Image أو Canvas (كالـ SSR)، يعاد الملف الأصلي
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      file,
      previewUrl: '',
      originalSizeBytes,
      compressedSizeBytes: originalSizeBytes,
      savedPercentage: 0,
      width: 0,
      height: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { width, height } = calculateTargetDimensions(img.naturalWidth, img.naturalHeight, maxDimension);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // بديل أمان في حال تعذر إنشاء السياق
        const fallbackUrl = URL.createObjectURL(file);
        return resolve({
          file,
          previewUrl: fallbackUrl,
          originalSizeBytes,
          compressedSizeBytes: originalSizeBytes,
          savedPercentage: 0,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      }

      // تحسين دقة عرض الخطوط والأرقام الحادة
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            const fallbackUrl = URL.createObjectURL(file);
            return resolve({
              file,
              previewUrl: fallbackUrl,
              originalSizeBytes,
              compressedSizeBytes: originalSizeBytes,
              savedPercentage: 0,
              width,
              height,
            });
          }

          // إذا كانت النتيجة المضغوطة أصغر فعلاً نعتمدها، وإلا نعتمد الأصغر
          const shouldUseCompressed = blob.size < originalSizeBytes;
          const finalBlob = shouldUseCompressed ? blob : file;
          const finalName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
          const finalFile = new File([finalBlob], finalName, {
            type: shouldUseCompressed ? 'image/jpeg' : file.type,
            lastModified: Date.now(),
          });

          const compressedSizeBytes = finalFile.size;
          const savedPercentage = originalSizeBytes > 0
            ? Math.max(0, Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100))
            : 0;

          const previewUrl = URL.createObjectURL(finalFile);

          resolve({
            file: finalFile,
            previewUrl,
            originalSizeBytes,
            compressedSizeBytes,
            savedPercentage,
            width,
            height,
          });
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('تعذر قراءة ملف الصورة. يرجى التأكد من سلامة ملف الإيصال والمحاولة ثانية.'));
    };

    img.src = objectUrl;
  });
}
