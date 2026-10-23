'use client';

import { useState, useRef, useCallback } from 'react';
import { compressImage } from '../utils/imageCompressor';

export function useProductMedia(initialImages: string[] = []) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = useCallback(async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setIsUploadingImages(true);
    try {
      const compressedPreviews = await Promise.all(fileList.map((f) => compressImage(f)));
      setImages((prev) => [...prev, ...compressedPreviews]);
      setImageFiles((prev) => [...prev, ...fileList]);
    } catch (err) {
      console.error('Failed to process images:', err);
    } finally {
      setIsUploadingImages(false);
    }
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    images,
    setImages,
    imageFiles,
    setImageFiles,
    isUploadingImages,
    fileInputRef,
    handleFilesSelected,
    handleRemoveImage,
  };
}
