import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

// Use local worker via Vite's ?url plugin for reliability and to avoid external CDN dependencies.
// @ts-ignore - Vite will correctly resolve this URL at runtime.
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const generatePdfPreview = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({ canvasContext: ctx, viewport } as any).promise;
    
    return await new Promise<string>((res) => {
      canvas.toBlob((blob) => {
        if (blob) {
          res(URL.createObjectURL(blob));
        } else {
          res('');
        }
      }, 'image/jpeg', 0.8);
    });
  } catch (e) {
    console.error('Preview error', e);
    return '';
  }
};

export const compressPdf = async (
  file: File,
  targetSizeMB?: number,
  onProgress?: (msg: string) => void
): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const numPages = pdf.numPages;

      let finalBlobs: Blob[] = [];
      let finalDimensions: { width: number; height: number }[] = [];

      if (!targetSizeMB || targetSizeMB <= 0) {
        onProgress?.('Rendering pages...');
        const result = await renderAndCompress(pdf, 1.5, 0.75, onProgress);
        finalBlobs = result.blobs;
        finalDimensions = result.dimensions;
      } else {
        const targetBytes = targetSizeMB * 1024 * 1024;
        
        onProgress?.('Analyzing document structure...');
        
        // Pick sample pages to evaluate complexity (up to 3 pages)
        const samplePages = Array.from(new Set([1, Math.max(1, Math.floor(numPages / 2)), numPages]));
        const targetBytesPerSample = (targetBytes / numPages) * samplePages.length;
        
        // Estimate ideal scale by rendering samples at 1.5x and 0.85 quality
        let initialScale = 1.5;
        let testBlobs: Blob[] = [];
        
        for (const pageNum of samplePages) {
           const { blobs } = await renderTargetPages(pdf, [pageNum], initialScale, 0.85);
           if (blobs.length) testBlobs.push(blobs[0]);
        }
        
        const initialSamplesSize = testBlobs.reduce((sum, b) => sum + b.size, 0) * 1.05; // 5% metadata buffer
        
        let bestScale = initialScale;
        
        if (initialSamplesSize > 0) {
            // Scale size relationship: Size ~ Scale^2
            // multiplier = sqrt(target_size / current_size)
            const multiplier = Math.sqrt(targetBytesPerSample / initialSamplesSize);
            bestScale = initialScale * multiplier;
            // Bound the scale: min 0.8 (too small is unreadable), max 6.0 (too large crashes canvas memory)
            bestScale = Math.max(0.8, Math.min(bestScale, 6.0));
        }

        onProgress?.(`Tuning compression (Scale: ${bestScale.toFixed(2)}x)...`);

        // Now that we have the ideal scale, we fine-tune the JPEG quality (0.3 to 0.95) using binary search on the samples
        // To do this fast, we need to cache the canvases for the sample pages
        const sampleCanvases: HTMLCanvasElement[] = [];
        for (const pageNum of samplePages) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: bestScale });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                await page.render({ canvasContext: ctx, viewport } as any).promise;
                sampleCanvases.push(canvas);
            }
        }

        let lowQ = 0.3;
        let highQ = 0.95;
        let bestQ = 0.3;
        let bestDiff = Infinity;

        for (let i = 0; i < 5; i++) {
            const midQ = (lowQ + highQ) / 2;
            const currentBlobs = await Promise.all(
                sampleCanvases.map(c => new Promise<Blob>((res) => c.toBlob(b => res(b!), 'image/jpeg', midQ)))
            );
            const size = currentBlobs.reduce((sum, b) => sum + b.size, 0) * 1.05;
            
            const diff = targetBytesPerSample - size;
            if (diff >= 0 && diff < bestDiff) {
                bestDiff = diff;
                bestQ = midQ;
            }

            if (size <= targetBytesPerSample) {
                lowQ = midQ; // can afford better quality
            } else {
                highQ = midQ; // too big, lower quality
            }
        }
        
        // Free sample canvases
        sampleCanvases.forEach(c => { c.width = 0; c.height = 0; });

        onProgress?.(`Applying optimal parameters (Q: ${Math.round(bestQ * 100)}%)...`);
        const result = await renderAndCompress(pdf, bestScale, bestQ, onProgress);
        finalBlobs = result.blobs;
        finalDimensions = result.dimensions;
      }

      onProgress?.('Generating PDF...');
      const outBlob = await generatePdfFromBlobs(finalBlobs, finalDimensions);
      
      if (outBlob.size > file.size && (!targetSizeMB || outBlob.size > targetSizeMB * 1024 * 1024)) {
         resolve(file);
      } else {
         resolve(outBlob);
      }

    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Renders PDF pages to canvases and compresses them to blobs.
 */
async function renderAndCompress(
  pdf: any, 
  scale: number, 
  quality: number, 
  onProgress?: (m: string) => void
): Promise<{ blobs: Blob[], dimensions: { width: number, height: number }[] }> {
  const numPages = pdf.numPages;
  const blobs: Blob[] = [];
  const dimensions: { width: number, height: number }[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context failed');

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    dimensions.push({ width: viewport.width, height: viewport.height });

    await page.render({ canvasContext: ctx, viewport } as any).promise;
    
    const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/jpeg', quality));
    blobs.push(blob);
    
    // Clean up canvas
    canvas.width = 0;
    canvas.height = 0;
  }

  return { blobs, dimensions };
}

async function renderTargetPages(
  pdf: any,
  pages: number[],
  scale: number,
  quality: number
): Promise<{ blobs: Blob[], dimensions: { width: number, height: number }[] }> {
  const blobs: Blob[] = [];
  const dimensions: { width: number, height: number }[] = [];

  for (const pageNum of pages) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    dimensions.push({ width: viewport.width, height: viewport.height });

    await page.render({ canvasContext: ctx, viewport } as any).promise;
    
    const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/jpeg', quality));
    blobs.push(blob);
    
    canvas.width = 0;
    canvas.height = 0;
  }
  return { blobs, dimensions };
}

async function generatePdfFromBlobs(blobs: Blob[], dimensions: { width: number, height: number }[]): Promise<Blob> {
  const pdfDoc = new jsPDF({
    unit: 'px',
    format: 'a4',
    compress: true // Internal jspdf compression for stream objects
  });

  pdfDoc.deletePage(1);

  for (let i = 0; i < blobs.length; i++) {
    const dim = dimensions[i];
    const blob = blobs[i];
    
    const dataUrl = await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(blob);
    });

    pdfDoc.addPage([dim.width, dim.height], dim.width > dim.height ? 'l' : 'p');
    pdfDoc.addImage(dataUrl, 'JPEG', 0, 0, dim.width, dim.height);
  }

  return pdfDoc.output('blob');
}
