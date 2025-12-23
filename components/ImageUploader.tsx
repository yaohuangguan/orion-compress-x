import React, { useCallback, useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { SUPPORTED_IMAGE_TYPES } from '../constants';
import { Language, translations } from '../translations';

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
  lang: Language;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFilesSelected, lang }) => {
  const [isDragging, setIsDragging] = useState(false);
  const t = translations[lang].uploader;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter((file: File) => 
        SUPPORTED_IMAGE_TYPES.includes(file.type)
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter((file: File) => 
        SUPPORTED_IMAGE_TYPES.includes(file.type)
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
    // Reset value so same file can be selected again
    e.target.value = '';
  }, [onFilesSelected]);

  // Handle global paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const validFiles = Array.from(e.clipboardData.files).filter((file: File) => 
            SUPPORTED_IMAGE_TYPES.includes(file.type)
        );
        if (validFiles.length > 0) {
          onFilesSelected(validFiles);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesSelected]);

  return (
    <div 
      className={`relative w-full border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50' 
          : 'border-slate-300 hover:border-indigo-400 bg-slate-50'
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept={SUPPORTED_IMAGE_TYPES.join(',')}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileInput}
      />
      
      <div className="flex flex-col items-center justify-center text-center space-y-4 pointer-events-none">
        <div className={`p-4 rounded-full ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400 shadow-sm'}`}>
          <Upload className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {t.title}
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            {t.sub}
          </p>
        </div>
        <div className="flex gap-2">
            <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">{t.paste}</span>
            <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">{t.drag}</span>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;