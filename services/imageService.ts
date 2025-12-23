/**
 * Client-side image compression and conversion service.
 * Uses HTML5 Canvas to resize/re-encode images.
 */

export const compressImage = async (
  file: File,
  quality: number,
  outputFormat: string = 'image/webp'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Strategy:
        // For lossy formats (JPEG, WEBP, AVIF), 'quality' (0-1) controls encoding quality. Dimensions stay 100%.
        // For lossless/fixed formats (PNG, BMP, GIF), 'quality' controls encoding strictly in some browsers, 
        // but often does nothing in standard Canvas. 
        // To ensure "compression" for PNG when the user lowers the slider, we scale the dimensions.
        
        const isLosslessFormat = ['image/png', 'image/bmp', 'image/gif'].includes(outputFormat);
        
        // If it's PNG and quality is < 1, we interpret quality as "Scale" to ensure size reduction.
        // If quality is 1.0, we keep original size.
        const shouldResize = isLosslessFormat && quality < 1;
        
        const targetWidth = shouldResize ? Math.max(1, Math.floor(img.width * quality)) : img.width;
        const targetHeight = shouldResize ? Math.max(1, Math.floor(img.height * quality)) : img.height;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d', { 
            alpha: true,
            willReadFrequently: false
        });
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Handle transparency for JPEG (replace with white background)
        if (outputFormat === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // For lossy formats, pass quality directly.
        // For lossless formats (resizing handled above), pass null or undefined if not supported, 
        // but passing a number usually doesn't hurt (ignored by PNG spec in generic implementations).
        const encodingQuality = isLosslessFormat ? undefined : quality;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          },
          outputFormat,
          encodingQuality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  // Use Math.abs to handle negative numbers (size increase) without causing NaN in Math.log
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return `${parseFloat((Math.abs(bytes) / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};