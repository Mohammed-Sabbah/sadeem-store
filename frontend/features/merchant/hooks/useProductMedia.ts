'use client';

import { useState, useRef, useCallback } from 'react';
import { compressImage } from '../utils/imageCompressor';

interface MediaSlot {
  id: string;
  url: string;
  file?: File;
}

export function useProductMedia(initialImages: string[] = []) {
  const [slots, setSlots] = useState<MediaSlot[]>(() =>
    initialImages.map((url, idx) => ({
      id: `init-${idx}-${url.slice(-10)}`,
      url,
    }))
  );
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تحديث الخانات عند تحميل صور جديدة من قاعدة البيانات
  const setImages = useCallback((urls: string[]) => {
    setSlots(
      urls.map((url, idx) => ({
        id: `db-${idx}-${url.slice(-10)}`,
        url,
      }))
    );
  }, []);

  const handleFilesSelected = useCallback(
    async (eventOrFiles: React.ChangeEvent<HTMLInputElement> | FileList | File[]) => {
      let fileList: File[] = [];
      if ('target' in eventOrFiles) {
        if (eventOrFiles.target.files) {
          fileList = Array.from(eventOrFiles.target.files);
        }
        eventOrFiles.target.value = '';
      } else {
        fileList = Array.from(eventOrFiles);
      }
      if (fileList.length === 0) return;

      setIsUploadingImages(true);
      try {
        const compressedPreviews = await Promise.all(fileList.map((f) => compressImage(f)));
        const newSlots: MediaSlot[] = fileList.map((file, idx) => ({
          id: `new-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          url: compressedPreviews[idx],
          file,
        }));
        setSlots((prev) => [...prev, ...newSlots]);
      } catch (err) {
        console.error('Failed to process images:', err);
      } finally {
        setIsUploadingImages(false);
      }
    },
    []
  );

  const handleRemoveImage = useCallback((index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // إزاحة صورة من موضع إلى موضع آخر مع الحفاظ التام على تزامن الملفات الخام
  const handleMoveImage = useCallback((fromIndex: number, toIndex: number) => {
    setSlots((prev) => {
      if (
        fromIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex < 0 ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  // نقل صورة إلى المركز الأول بنقرة واحدة لتصبح الغلاف الرئيسي
  const handleSetCoverImage = useCallback((index: number) => {
    setSlots((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.unshift(moved);
      return updated;
    });
  }, []);

  // اشتقاق مصفوفة الروابط للمعاينة ومصفوفة الملفات للرفع للسيرفر بتزامن مثالي
  const images = slots.map((s) => s.url);
  const imageFiles = slots.filter((s) => s.file !== undefined).map((s) => s.file!);

  return {
    images,
    setImages,
    imageFiles,
    isUploadingImages,
    fileInputRef,
    handleFilesSelected,
    handleRemoveImage,
    handleMoveImage,
    handleSetCoverImage,
  };
}
