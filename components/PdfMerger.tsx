import React, { useState, useRef } from 'react';
import { FileStack, ArrowUp, ArrowDown, Trash2, Download, Plus, AlertCircle, CheckCircle2, File } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Language, translations } from '../translations';

interface PdfMergerProps {
  lang: Language;
}

const PdfMerger: React.FC<PdfMergerProps> = ({ lang }) => {
  const t = translations[lang] as any;
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [errorItem, setErrorItem] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tMerger = (translations[lang] as any).pdfMerger;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = (Array.from(e.target.files) as File[]).filter(f => f.type === 'application/pdf');
      setFiles(prev => [...prev, ...selectedFiles]);
      setMergedBlob(null);
      setErrorItem(null);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index - 1];
    newFiles[index - 1] = temp;
    setFiles(newFiles);
    setMergedBlob(null);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index + 1];
    newFiles[index + 1] = temp;
    setFiles(newFiles);
    setMergedBlob(null);
  };

  const remove = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    setMergedBlob(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const mergePdfs = async () => {
    if (files.length < 2) return;
    
    setIsProcessing(true);
    setErrorItem(null);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setMergedBlob(blob);
    } catch (err) {
      console.error('Error merging PDFs:', err);
      setErrorItem(tMerger.error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!mergedBlob) return;
    const url = URL.createObjectURL(mergedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merged_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileStack className="w-6 h-6 text-indigo-600" />
            {(translations[lang] as any).nav.mergePdf}
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{(translations[lang] as any).uploader.title.split(' ')[0].replace(/,|，/g, '')}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="application/pdf"
            multiple
          />
        </div>

        {files.length === 0 ? (
          <div 
            className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileStack className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="font-medium text-lg mb-1">{(translations[lang] as any).uploader.title}</p>
            <p className="text-sm opacity-75">PDF Only</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {files.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <File className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => moveUp(idx)} 
                      disabled={idx === 0}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                      title={tMerger.moveUp}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => moveDown(idx)} 
                      disabled={idx === files.length - 1}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                      title={tMerger.moveDown}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <button 
                      onClick={() => remove(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title={tMerger.remove}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {errorItem && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errorItem}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
               {!mergedBlob ? (
                  <button
                    onClick={mergePdfs}
                    disabled={files.length < 2 || isProcessing}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {tMerger.processing}
                      </>
                    ) : (
                      <>
                        <FileStack className="w-4 h-4" />
                        {tMerger.mergeBtn.replace('{n}', files.length.toString())}
                      </>
                    )}
                  </button>
               ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                      {tMerger.ready} ({formatSize(mergedBlob.size)})
                    </span>
                    <button
                      onClick={downloadResult}
                      className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      {tMerger.downloadBtn}
                    </button>
                  </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfMerger;
