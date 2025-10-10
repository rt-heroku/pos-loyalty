'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
}

interface FileWithPreview extends File {
  preview?: string;
  error?: string;
}

export default function FileUploadModal({
  isOpen,
  onClose,
  onUpload,
}: FileUploadModalProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
  ];

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/'))
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (file.type.startsWith('video/'))
      return <Video className="h-8 w-8 text-purple-500" />;
    if (file.type.startsWith('audio/'))
      return <Music className="h-8 w-8 text-green-500" />;
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)} limit`;
    }
    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported';
    }
    return null;
  };

  const handleFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: FileWithPreview[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      const fileWithPreview: FileWithPreview = file;

      if (error) {
        fileWithPreview.error = error;
      } else {
        // Create preview for images
        if (file.type.startsWith('image/')) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }
      }

      validFiles.push(fileWithPreview);
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const file = newFiles[index];

      // Clean up preview URL
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }

      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleUpload = () => {
    const validFiles = files.filter(file => !file.error);
    if (validFiles.length > 0) {
      onUpload(validFiles);
      onClose();
      setFiles([]);
    }
  };

  const handleClose = () => {
    // Clean up preview URLs
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Upload Files
            </h3>
            <button
              onClick={handleClose}
              className="rounded-lg p-1 transition-colors hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Drop Zone */}
            <div
              className={`
                rounded-lg border-2 border-dashed p-6 text-center transition-colors
                ${
                  dragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-2 text-gray-600">
                Drag and drop files here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="font-medium text-primary-500 hover:text-primary-600"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-400">
                Max file size: 10MB. Supported: Images, PDF, Text
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={allowedTypes.join(',')}
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
                {files.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-3 rounded-lg bg-gray-50 p-3"
                  >
                    {file.preview ? (
                      <Image
                        src={file.preview}
                        alt={file.name}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                    ) : (
                      getFileIcon(file)
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                      {file.error && (
                        <p className="mt-1 flex items-center text-xs text-red-500">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {file.error}
                        </p>
                      )}
                    </div>

                    {!file.error && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}

                    <button
                      onClick={() => removeFile(index)}
                      className="rounded p-1 transition-colors hover:bg-gray-200"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 border-t border-gray-200 bg-gray-50 p-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 transition-colors hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={files.filter(f => !f.error).length === 0}
              className="rounded-lg bg-primary-500 px-4 py-2 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Upload {files.filter(f => !f.error).length} file
              {files.filter(f => !f.error).length !== 1 ? 's' : ''}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
