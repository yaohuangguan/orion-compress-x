import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Download, FileAudio, FileVideo, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Button from './Button';
import { VIDEO_URL_REGEX } from '../constants';
import { Language, translations } from '../translations';

interface MediaToolsProps {
  lang: Language;
}

// Fallback instances in case one is down or rate-limited
// Using a mix of official and community instances for better reliability
const API_INSTANCES = [
    'https://api.cobalt.tools/api/json',
    'https://co.wuk.sh/api/json',
    'https://api.douyin.wtf/api/json',
    'https://cobalt.qinxin.top/api/json',
    'https://cobalt.api.sc/api/json'
];

const MediaTools: React.FC<MediaToolsProps> = ({ lang }) => {
  const [url, setUrl] = useState('');
  const [targetType, setTargetType] = useState<'mp4' | 'mp3'>('mp4');
  const [status, setStatus] = useState<'idle' | 'validating' | 'processing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState('');

  const t = translations[lang].media;

  // Reset state when type changes
  useEffect(() => {
    if (status === 'done' || status === 'error') {
        setStatus('idle');
        setDownloadUrl('');
        setErrorMsg('');
        setProgress(0);
    }
  }, [targetType]);

  const validateAndProcess = async () => {
    setErrorMsg('');
    setStatus('validating');
    setDownloadUrl('');

    // Offline check
    if (!navigator.onLine) {
        setStatus('error');
        setErrorMsg('No internet connection. Please check your network.');
        return;
    }

    // Regex check
    if (!VIDEO_URL_REGEX.test(url)) {
        setTimeout(() => {
            setStatus('error');
            setErrorMsg(t.error);
        }, 500);
        return;
    }
    
    // Start processing
    setStatus('processing');
    setProgress(10); 
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 5;
      });
    }, 200);

    try {
        let successData = null;
        let lastError = null;

        for (const apiBase of API_INSTANCES) {
            try {
                // Controller to timeout requests that hang
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per instance

                const response = await fetch(apiBase, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: url,
                        vQuality: '720',
                        filenamePattern: 'classic',
                        isAudioOnly: targetType === 'mp3',
                        disableMetadata: true 
                    }),
                    signal: controller.signal,
                    mode: 'cors', // Explicitly request CORS
                    credentials: 'omit' // Prevent sending cookies which can cause CORS issues
                });
                
                clearTimeout(timeoutId);

                if (!response.ok) {
                    continue; 
                }
                
                const data = await response.json();
                
                if (data.status === 'error') {
                   lastError = new Error(data.text || 'Conversion failed');
                   continue;
                }

                if (data.url) {
                    successData = data;
                    break;
                }
            } catch (err) {
                console.warn(`Failed to fetch from ${apiBase}`, err);
                lastError = err;
            }
        }

        if (successData) {
            clearInterval(progressInterval);
            setProgress(100);
            setDownloadUrl(successData.url);
            setStatus('done');
        } else {
            throw lastError || new Error('All service instances are currently unavailable.');
        }

    } catch (error: any) {
        clearInterval(progressInterval);
        console.error("Media processing error:", error);
        setStatus('error');
        
        let msg = error.message;
        // Provide helpful hints for common fetch errors
        if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
            msg = 'Network error: Please disable AdBlockers or check your connection.';
        } else if (msg.includes('aborted')) {
            msg = 'Request timed out. Please try again.';
        } else if (!msg) {
            msg = 'An unexpected error occurred.';
        }
        
        setErrorMsg(msg);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
        window.open(downloadUrl, '_blank');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4 mb-10">
        <h2 className="text-3xl font-bold text-slate-900">{translations[lang].hero.videoTitle}</h2>
        <p className="text-slate-500">
          {translations[lang].hero.videoDesc}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden">
        <div className="p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 h-2"></div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className={`h-5 w-5 ${status === 'error' ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                type="url"
                className={`block w-full pl-10 pr-4 py-4 text-slate-900 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 ${
                    status === 'error' ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-slate-200'
                }`}
                placeholder={t.inputPlaceholder}
                value={url}
                onChange={(e) => {
                    setUrl(e.target.value);
                    if (status === 'error') setStatus('idle');
                    if (status === 'done') setStatus('idle');
                }}
                disabled={status === 'processing' || status === 'validating'}
                />
            </div>
            {status === 'error' && (
                <div className="flex items-center text-red-500 text-sm px-1 animate-fade-in">
                    <AlertCircle className="w-4 h-4 mr-1.5" />
                    {errorMsg}
                </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button
               onClick={() => setTargetType('mp4')}
               disabled={status === 'processing'}
               className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all ${
                 targetType === 'mp4' 
                 ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' 
                 : 'border-slate-100 hover:border-slate-300 text-slate-600'
               } ${status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
                <FileVideo className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">{t.mp4Btn}</div>
                  <div className="text-xs opacity-70">{t.mp4Desc}</div>
                </div>
             </button>

             <button
               onClick={() => setTargetType('mp3')}
               disabled={status === 'processing'}
               className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all ${
                 targetType === 'mp3' 
                 ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' 
                 : 'border-slate-100 hover:border-slate-300 text-slate-600'
               } ${status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
                <FileAudio className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">{t.mp3Btn}</div>
                  <div className="text-xs opacity-70">{t.mp3Desc}</div>
                </div>
             </button>
          </div>

          <Button 
            onClick={validateAndProcess} 
            disabled={!url || status === 'processing' || status === 'validating'}
            className="w-full py-4 text-lg shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300"
          >
            {status === 'validating' || status === 'processing' ? (
                <div className="flex items-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {status === 'validating' ? t.verify : t.processing}
                </div>
            ) : t.start}
          </Button>

          {status === 'processing' && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Fetching stream...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {status === 'done' && (
             <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-4 animate-scale-in">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-green-800 font-semibold text-lg">{t.complete}</h3>
                   <p className="text-green-600 text-sm">{t.readyMsg.replace('{type}', targetType.toUpperCase())}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={handleDownload}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" /> 
                    {t.downloadBtn.replace('{type}', targetType.toUpperCase())}
                  </Button>
                  <Button variant="secondary" onClick={() => { setStatus('idle'); setUrl(''); setDownloadUrl(''); }}>
                    {t.another}
                  </Button>
                </div>
             </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
         <span className="text-xs text-slate-400 font-medium">YouTube</span>
         <span className="text-xs text-slate-400 font-medium">Vimeo</span>
         <span className="text-xs text-slate-400 font-medium">TikTok</span>
         <span className="text-xs text-slate-400 font-medium">Instagram</span>
      </div>
    </div>
  );
};

export default MediaTools;