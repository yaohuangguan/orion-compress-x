export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/avif',
  'image/tiff',
  'application/pdf'
];

export const COMPRESSION_PRESETS = [
  { label: 'Lossless (Best Quality)', quality: 1.0 },
  { label: 'High Quality', quality: 0.9 },
  { label: 'Balanced', quality: 0.75 },
  { label: 'High Compression', quality: 0.5 },
];

export const FORMAT_OPTIONS = [
  { value: 'image/webp', label: 'WebP (Recommended)' },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/png', label: 'PNG' },
  { value: 'image/avif', label: 'AVIF (Best Compression)' },
  { value: 'image/bmp', label: 'BMP' },
  { value: 'image/gif', label: 'GIF (Static)' },
  { value: 'application/pdf', label: 'PDF Document' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word (Editable)' },
];

export const VIDEO_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com)\/.+$/;

export const MODEL_THINKING = 'gemini-3-pro-preview';