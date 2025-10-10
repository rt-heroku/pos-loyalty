'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X, Upload, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  currentImage?: string | null;
  onImageChange: (imageData: string | null) => void;
  onUpload: (imageData: {
    image_data: string;
    filename: string;
    file_size: number;
    width: number;
    height: number;
  }) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  currentImage,
  onImageChange,
  onUpload,
  size = 'md',
  className,
  disabled = false
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentImage changes
  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };


  const processImage = useCallback((file: File): Promise<{
    base64: string;
    width: number;
    height: number;
    fileSize: number;
  }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          // Resize image if too large
          const maxSize = 512;
          let { width, height } = img;
          
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Create canvas to resize
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const resizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            resolve({
              base64: resizedBase64,
              width,
              height,
              fileSize: resizedBase64.length
            });
          } else {
            reject(new Error('Failed to process image'));
          }
        };
        img.onerror = () => reject(new Error('Invalid image file'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file (JPG, PNG, GIF)');
      }

      // Validate file size (10MB limit)
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`Image size should be less than 10MB. Current size: ${sizeMB}MB`);
      }

      // Process image
      const result = await processImage(file);
      
      // Update preview
      setPreview(result.base64);
      onImageChange(result.base64);

      // Upload to server
      await onUpload({
        image_data: result.base64,
        filename: file.name,
        file_size: result.fileSize,
        width: result.width,
        height: result.height
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setError(errorMessage);
      console.error('Image upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [processImage, onImageChange, onUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleRemoveImage = useCallback(async () => {
    setError(null);
    setUploading(true);

    try {
      setPreview(null);
      onImageChange(null);
      await onUpload({
        image_data: '',
        filename: '',
        file_size: 0,
        width: 0,
        height: 0
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove image';
      setError(errorMessage);
      console.error('Image removal error:', err);
    } finally {
      setUploading(false);
    }
  }, [onImageChange, onUpload]);

  const handleClick = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading]);

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition-all duration-200',
          sizeClasses[size],
          !disabled && !uploading && 'cursor-pointer hover:border-primary-300 hover:bg-primary-50',
          uploading && 'cursor-not-allowed opacity-50',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        onClick={handleClick}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Profile preview"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
          </div>
        )}

        {preview && !uploading && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveImage();
            }}
            className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {!preview && !uploading && !disabled && (
          <button
            type="button"
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            <Upload className="h-3 w-3" />
          </button>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
}
