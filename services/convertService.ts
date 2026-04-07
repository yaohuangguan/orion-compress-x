import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import Tesseract from 'tesseract.js';

// Setup pdf js worker
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Converts an image file to a single-page PDF containing the embedded image.
 */
export const imageToPdf = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
             const dataUrl = reader.result as string;
             const img = new Image();
             img.onload = () => {
                 const pdfDoc = new jsPDF({
                     orientation: img.width > img.height ? 'l' : 'p',
                     unit: 'px',
                     format: [img.width, img.height],
                     compress: true
                 });
                 pdfDoc.addImage(dataUrl, 'JPEG', 0, 0, img.width, img.height);
                 resolve(pdfDoc.output('blob'));
             };
             img.onerror = (e) => reject(new Error('Failed to load image for PDF generation'));
             img.src = dataUrl;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};

/**
 * Converts an image to DOCX by extracting text using OCR (Tesseract.js).
 */
export const imageToDocx = async (file: File, onProgress?: (msg: string) => void): Promise<Blob> => {
    try {
        onProgress?.('Extracting text (OCR)... this may take a moment.');
        // We use English and Chinese Simplified as the default languages since the app is en/zh
        const { data: { text } } = await Tesseract.recognize(file, 'eng+chi_sim', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    onProgress?.(`Extracting text (OCR): ${Math.round(m.progress * 100)}%`);
                }
            }
        });

        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        onProgress?.('Generating Document...');
        const doc = new Document({
            sections: [{
                properties: {},
                children: lines.map(line => new Paragraph({
                    children: [new TextRun(line)]
                }))
            }]
        });

        return await Packer.toBlob(doc);
    } catch (e) {
        console.error('Image to Docx Error', e);
        throw new Error('Failed to generate Word document from image.');
    }
};

/**
 * Converts a PDF to DOCX by extracting TextContent streams.
 */
export const pdfToDocx = async (file: File, onProgress?: (msg: string) => void): Promise<Blob> => {
    try {
        onProgress?.('Reading PDF document...');
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const numPages = pdf.numPages;

        let allParagraphs: Paragraph[] = [];

        for (let i = 1; i <= numPages; i++) {
            onProgress?.(`Extracting text from page ${i} of ${numPages}...`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Reconstruct text lines heuristically based on Y coordinates if possible,
            // or just dump strings with spaces. 
            // pdfjs items have transform: [scaleX, skewY, skewX, scaleY, x, y]
            // We group items by approx Y coordinate
            
            const lineMap: Record<number, string[]> = {};
            const itemYs: number[] = [];

            for (const item of textContent.items) {
               if ('str' in item && item.str) {
                   const y = Math.round(item.transform[5]); // Y offset string
                   if (!lineMap[y]) {
                       lineMap[y] = [];
                       itemYs.push(y);
                   }
                   lineMap[y].push(item.str);
               }
            }

            // Sort by descending Y (in PDF, Y=0 is usually bottom)
            itemYs.sort((a, b) => b - a);

            const pageLines = [];
            for (const y of itemYs) {
               pageLines.push(lineMap[y].join(' ')); // Simple joining
            }

            const paragraphs = pageLines
               .filter(line => line.trim().length > 0)
               .map(line => new Paragraph({
                   children: [new TextRun(line)]
               }));
            
            allParagraphs.push(...paragraphs);

            // Add a page break between pages if it's not the last page
            // Wait, we can skip literal page breaks to keep text continuous, or add them.
            // Let's just keep text continuous for simpler reading.
        }

        onProgress?.('Generating Document...');
        
        const doc = new Document({
            sections: [{
                properties: {},
                children: allParagraphs.length > 0 ? allParagraphs : [new Paragraph("No text could be extracted from this PDF.")]
            }]
        });

        return await Packer.toBlob(doc);

    } catch (e) {
        console.error('PDF to Docx Error', e);
        throw new Error('Failed to extract text from PDF document.');
    }
};
