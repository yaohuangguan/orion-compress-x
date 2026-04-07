import React, { useState } from 'react';
import { UploadedFile } from '../types';
import { formatBytes, compressImage } from '../services/imageService';
import { compressPdf } from '../services/pdfCompressor';
import { imageToPdf, imageToDocx, pdfToDocx } from '../services/convertService';
import { Download, Trash2, ArrowRight, Check, Sparkles, Copy, ClipboardCheck, AlertTriangle, Lock, FileText } from 'lucide-react';
import Button from './Button';
import { FORMAT_OPTIONS } from '../constants';
import { Language, translations } from '../translations';
import { useAuth } from '../context/AuthContext';
import { checkLimit, getRemainingCount, incrementUsage } from '../services/usageService';

interface CompressorProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  mode: 'compress' | 'convert';
  lang: Language;
}

// Helper to convert any image blob to PNG blob for clipboard compatibility
const convertToPng = (sourceBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(sourceBlob);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context failed'));
                return;
            }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((pngBlob) => {
                if (pngBlob) resolve(pngBlob);
                else reject(new Error('PNG conversion failed'));
                URL.revokeObjectURL(url);
            }, 'image/png');
        };
        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
        img.src = url;
    });
};

const Compressor: React.FC<CompressorProps> = ({ files, setFiles, mode, lang }) => {
  const [quality, setQuality] = useState(0.85);
  const [targetPdfMb, setTargetPdfMb] = useState<number | ''>('');
  const [targetFormat, setTargetFormat] = useState<string>('image/webp');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});
  const [limitReached, setLimitReached] = useState(false);

  const hasPdf = files.some(f => f.file.type === 'application/pdf');

  const { user, setShowAuthModal } = useAuth();
  const t = translations[lang].compressor;
  const tLimit = translations[lang].limits;

  const handleRemove = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processFiles = async () => {
    const usageType = mode === 'compress' ? 'compress' : 'convert';
    
    // Check Limits
    if (!checkLimit(usageType, user)) {
        setLimitReached(true);
        return;
    }

    setIsProcessing(true);
    const newFiles = [...files];

    // Reset status
    setFiles(newFiles.map(f => ({ ...f, status: 'processing' })));

    // Only process one file at a time to check limits on each if needed, 
    // but here we just check once per batch or we need to check per file?
    // The requirement says "5 compressions". If batch has 10, we should probably stop after 5 for guests.
    // For simplicity, we check if they have ANY allowance left to start the batch, 
    // OR we count each file. Let's count each file for strict enforcement.

    let processedCount = 0;

    for (const file of newFiles) {
      // Check limit before EACH file
      if (!checkLimit(usageType, user)) {
          file.status = 'error'; // Mark remainder as error or idle
          setLimitReached(true);
          break; // Stop processing
      }

      try {
        file.status = 'processing';
        setFiles([...newFiles]);
        
        await new Promise(r => requestAnimationFrame(r));

        const usedQuality = mode === 'convert' ? 0.95 : quality;
        let blob: Blob;

        if (mode === 'convert' && targetFormat === 'application/pdf') {
            if (file.file.type === 'application/pdf') {
                blob = file.file;
            } else {
                blob = await imageToPdf(file.file);
            }
            file.format = 'application/pdf';
        } else if (mode === 'convert' && targetFormat === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            if (file.file.type === 'application/pdf') {
                blob = await pdfToDocx(file.file);
            } else {
                blob = await imageToDocx(file.file);
            }
            file.format = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (file.file.type === 'application/pdf') {
            blob = await compressPdf(file.file, targetPdfMb === '' ? undefined : targetPdfMb, (msg) => {
                // optionally update file status message here later
            });
            file.format = 'application/pdf';
        } else {
            blob = await compressImage(file.file, usedQuality, targetFormat);
            file.format = targetFormat;
        }
        
        file.processedUrl = URL.createObjectURL(blob);
        file.processedSize = blob.size;
        file.status = 'done';
        
        // Increment usage
        incrementUsage(usageType);
        processedCount++;

      } catch (error) {
        console.error(error);
        file.status = 'error';
      }
      setFiles([...newFiles]);
    }
    setIsProcessing(false);
  };

  const handleDownload = (file: UploadedFile) => {
    if (!file.processedUrl) return;
    const a = document.createElement('a');
    a.href = file.processedUrl;
    let ext = 'webp';
    if (file.format) {
        if (file.format === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            ext = 'docx';
        } else {
            ext = file.format.split('/')[1];
        }
    }
    a.download = `orion_${mode}_${file.name.split('.')[0]}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = async (file: UploadedFile) => {
    if (!file.processedUrl) return;
    try {
      const response = await fetch(file.processedUrl);
      let blob = await response.blob();
      if (blob.type !== 'image/png') {
         blob = await convertToPng(blob);
      }
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      setCopyStatus(prev => ({ ...prev, [file.id]: true }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [file.id]: false }));
      }, 2000);
    } catch (err: any) {
      console.error("Copy failed", err);
      alert(`${t.copyFail}: ${err.message}`);
    }
  };

  const handleDownloadAll = () => {
    files.forEach(file => {
        if (file.status === 'done') handleDownload(file);
    });
  };

  if (files.length === 0) return null;

  const allDone = files.length > 0 && files.every(f => f.status === 'done');
  const remaining = getRemainingCount(mode === 'compress' ? 'compress' : 'convert', user);

  return (
    <div className="w-full space-y-6">
      
      {/* Limit Alert */}
      {limitReached && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                      <Lock className="w-5 h-5" />
                  </div>
                  <div>
                      <h4 className="font-semibold text-orange-900">
                          {!user ? tLimit.guestLimit : tLimit.userLimit}
                      </h4>
                      <p className="text-sm text-orange-700">
                          {!user ? tLimit.guestLimitDesc : tLimit.userLimitDesc}
                      </p>
                  </div>
              </div>
              {!user && (
                  <Button size="sm" onClick={() => setShowAuthModal(true)} className="bg-orange-600 hover:bg-orange-700 text-white border-none">
                      {tLimit.loginBtn}
                  </Button>
              )}
          </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-4 z-20">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex-1 w-full lg:w-auto space-y-6 lg:space-y-0 lg:space-x-8 flex flex-col lg:flex-row">
                
                {mode === 'compress' && !hasPdf && (
                  <div className="flex-1 min-w-[240px]">
                      <label className="block text-sm font-medium text-slate-700 mb-3 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                             <Sparkles className="w-4 h-4 text-indigo-500" />
                             <span>{t.level}</span>
                          </div>
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">
                              {Math.round(quality * 100)}% {t.quality}
                          </span>
                      </label>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="1" 
                        step="0.01"
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                  </div>
                )}
                
                {mode === 'compress' && hasPdf && (
                  <div className="flex-1 min-w-[240px]">
                      <label className="block text-sm font-medium text-slate-700 mb-3 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                             <FileText className="w-4 h-4 text-indigo-500" />
                             <span>{(t as any).pdfMaxMB || 'Target Size (MB)'}</span>
                          </div>
                          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold max-w-[120px] truncate" title={(t as any).pdfWarning || 'Text will be converted to image'}>
                              {(t as any).pdfWarning || 'Text will be converted to image'}
                          </span>
                      </label>
                      <input 
                        type="number" 
                        placeholder="e.g. 2.5"
                        min="0.1" 
                        step="0.1"
                        value={targetPdfMb}
                        onChange={(e) => setTargetPdfMb(e.target.value ? parseFloat(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-slate-300 transition-colors"
                      />
                  </div>
                )}

                {!hasPdf && (
                  <div className="min-w-[280px]">
                      <label className="block text-sm font-medium text-slate-700 mb-3">{t.target}</label>
                      <div className="grid grid-cols-4 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                          {FORMAT_OPTIONS.map(opt => (
                              <button
                                  key={opt.value}
                                  onClick={() => setTargetFormat(opt.value)}
                                  className={`px-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                                      targetFormat === opt.value 
                                      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
                                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                  }`}
                              >
                                  {opt.label.split(' ')[0]}
                              </button>
                          ))}
                      </div>
                  </div>
                )}

            </div>

            <div className="flex flex-col items-end gap-2 w-full lg:w-auto">
                <div className="flex gap-3 w-full lg:w-auto">
                    <Button onClick={processFiles} isLoading={isProcessing} size="lg" className="flex-1 lg:flex-none shadow-md shadow-indigo-100">
                    {allDone 
                        ? (mode === 'compress' 
                            ? t.reCompressBtn.replace('{n}', files.length.toString()) 
                            : t.reConvertBtn.replace('{n}', files.length.toString()))
                        : (mode === 'compress' 
                            ? t.compressBtn.replace('{n}', files.length.toString()) 
                            : t.convertBtn.replace('{n}', files.length.toString()))
                    }
                    </Button>
                    
                    {files.some(f => f.status === 'done') && (
                        <Button onClick={handleDownloadAll} variant="secondary" size="lg" className="flex-1 lg:flex-none" title={t.downloadAll}>
                            <Download className="w-5 h-5" />
                        </Button>
                    )}
                </div>
                {/* Usage Counter Display */}
                <div className="text-xs text-slate-400 font-medium">
                     {tLimit.remaining} <span className={remaining === 0 ? "text-red-500 font-bold" : "text-slate-600"}>{remaining}</span>
                </div>
            </div>
        </div>
      </div>

      {/* File List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {files.map(file => {
          const sizeDiff = file.processedSize ? file.originalSize - file.processedSize : 0;
          const isIncrease = sizeDiff < 0;
          
          return (
            <div key={file.id} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
            
            <div className="aspect-video bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                <img src={file.previewUrl} alt={file.name} className="object-contain w-full h-full p-2" />
                
                {isProcessing && file.status === 'processing' && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                <button 
                    onClick={() => handleRemove(file.id)}
                    className="absolute top-2 right-2 p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-sm z-20"
                    title="Remove file"
                >
                    <Trash2 className="w-4 h-4" />
                </button>

                <div className="absolute bottom-2 left-2">
                    {file.status === 'done' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium shadow-sm">
                            <Check className="w-3 h-3 mr-1" /> {t.ready}
                        </span>
                    )}
                    {file.status === 'error' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-medium">
                            {t.error}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-900 truncate" title={file.name}>{file.name}</h4>
                
                <div className="flex items-center justify-between text-xs bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div>
                        <div className="text-slate-400 font-medium mb-0.5">{t.original}</div>
                        <div className="text-slate-700 font-mono">{formatBytes(file.originalSize)}</div>
                    </div>
                    
                    {file.status === 'done' && file.processedSize ? (
                        <>
                            <ArrowRight className="w-4 h-4 text-slate-300" />
                            <div className="text-right">
                                <div className="text-indigo-400 font-medium mb-0.5">
                                    {mode === 'compress' ? t.optimized : t.converted}
                                </div>
                                <div className={`font-mono font-bold ${isIncrease ? 'text-red-600' : 'text-slate-900'}`}>
                                    {formatBytes(file.processedSize)}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-right opacity-50">
                             <div className="text-slate-400 font-medium mb-0.5">{t.target}</div>
                             <div className="text-slate-400 font-mono">---</div>
                        </div>
                    )}
                </div>

                {file.status === 'done' && file.processedSize && (
                   <div className="pt-2 border-t border-slate-100">
                       {mode === 'compress' && (
                         <div className="flex flex-col items-center mb-3">
                           <div className={`text-xs font-medium flex items-center justify-center ${isIncrease ? 'text-red-500' : 'text-green-600'}`}>
                               {isIncrease ? <AlertTriangle className="w-3 h-3 mr-1.5" /> : <Sparkles className="w-3 h-3 mr-1.5" />}
                               
                               {isIncrease 
                                ? `${t.increased} ${formatBytes(sizeDiff)}` 
                                : `${t.saved} ${formatBytes(sizeDiff)}` 
                               } 
                               {' '}
                               ({Math.round(Math.abs((sizeDiff / file.originalSize)) * 100)}%)
                           </div>
                           {isIncrease && (
                                <p className="text-[10px] text-slate-400 text-center mt-1 leading-tight max-w-[200px]">
                                    {t.sizeIncreaseTip}
                                </p>
                           )}
                         </div>
                       )}
                       <div className="flex gap-2">
                           <Button onClick={() => handleDownload(file)} variant="primary" size="sm" className="flex-1 bg-slate-900 hover:bg-slate-800">
                               <Download className="w-4 h-4 mr-2" /> {t.download}
                           </Button>
                           <Button 
                              onClick={() => handleCopy(file)} 
                              variant="secondary" 
                              size="sm" 
                              className={`px-3 transition-colors ${copyStatus[file.id] ? 'bg-green-100 text-green-700' : ''}`}
                              title={t.copy}
                           >
                              {copyStatus[file.id] ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                           </Button>
                       </div>
                   </div>
                )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default Compressor;
