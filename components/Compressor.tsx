import React, { useState } from 'react';
import { UploadedFile } from '../types';
import { formatBytes, compressImage } from '../services/imageService';
import { Download, Trash2, ArrowRight, Check, Sparkles, Copy, ClipboardCheck, AlertTriangle } from 'lucide-react';
import Button from './Button';
import { FORMAT_OPTIONS } from '../constants';
import { Language, translations } from '../translations';

interface CompressorProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  mode: 'compress' | 'convert';
  lang: Language;
}

const Compressor: React.FC<CompressorProps> = ({ files, setFiles, mode, lang }) => {
  const [quality, setQuality] = useState(0.85);
  const [targetFormat, setTargetFormat] = useState<string>('image/webp');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});

  const t = translations[lang].compressor;

  const handleRemove = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processFiles = async () => {
    setIsProcessing(true);
    const newFiles = [...files];

    // Reset status for re-processing to give visual feedback
    setFiles(newFiles.map(f => ({ ...f, status: 'processing' })));

    for (const file of newFiles) {
      // We removed the 'if status === done continue' check to allow re-compression
      try {
        // Update individual file status to ensure UI reflects processing state
        file.status = 'processing';
        setFiles([...newFiles]);
        
        // Small delay to allow UI to update
        await new Promise(r => requestAnimationFrame(r));

        const usedQuality = mode === 'convert' ? 0.95 : quality;
        const blob = await compressImage(file.file, usedQuality, targetFormat);
        
        // If there was a previous URL, ideally we should revoke it, but for simplicity in this flow we overwrite.
        file.processedUrl = URL.createObjectURL(blob);
        file.processedSize = blob.size;
        file.format = targetFormat;
        file.status = 'done';
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
    const ext = file.format ? file.format.split('/')[1] : 'webp';
    a.download = `orion_${mode}_${file.name.split('.')[0]}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = async (file: UploadedFile) => {
    if (!file.processedUrl) return;
    try {
      const response = await fetch(file.processedUrl);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      
      setCopyStatus(prev => ({ ...prev, [file.id]: true }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [file.id]: false }));
      }, 2000);
    } catch (err) {
      console.error("Copy failed", err);
      alert(t.copyFail);
    }
  };

  const handleDownloadAll = () => {
    files.forEach(file => {
        if (file.status === 'done') handleDownload(file);
    });
  };

  if (files.length === 0) return null;

  const allDone = files.length > 0 && files.every(f => f.status === 'done');

  return (
    <div className="w-full space-y-6">
      
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-4 z-20">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex-1 w-full lg:w-auto space-y-6 lg:space-y-0 lg:space-x-8 flex flex-col lg:flex-row">
                
                {mode === 'compress' && (
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
                      <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                          <span>{t.maxComp}</span>
                          <span>{t.maxQual}</span>
                      </div>
                  </div>
                )}

                <div className="min-w-[280px]">
                    <label className="block text-sm font-medium text-slate-700 mb-3">{t.target}</label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
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

            </div>

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