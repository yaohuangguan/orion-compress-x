import React, { useState } from 'react';
import { Layers, Image as ImageIcon, Video, Menu, X, Globe, Aperture, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import { AppMode, UploadedFile } from './types';
import ImageUploader from './components/ImageUploader';
import Compressor from './components/Compressor';
import MediaTools from './components/MediaTools';
import { Language, translations } from './translations';
import { useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppMode>(AppMode.COMPRESS);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const [lang, setLang] = useState<Language>('en');
  const { user, logout, setShowAuthModal } = useAuth();

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  const t = translations[lang];

  const handleFilesSelected = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      originalSize: file.size,
      status: 'idle',
      name: file.name
    }));
    setFiles(prev => [...prev, ...uploadedFiles]);
    if (activeTab === AppMode.MEDIA_DOWNLOAD) {
        setActiveTab(AppMode.COMPRESS);
    }
  };

  const tabs = [
    { id: AppMode.COMPRESS, label: t.nav.compress, icon: Layers },
    { id: AppMode.CONVERT, label: t.nav.convert, icon: ImageIcon },
    { id: AppMode.MEDIA_DOWNLOAD, label: t.nav.video, icon: Video },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      <AuthModal lang={lang} />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-md">
                    <Aperture className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">{t.nav.appName}</span>
                <span className="font-bold text-xl tracking-tight text-slate-900 sm:hidden">Orion</span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-1 items-center">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-slate-100 text-indigo-600'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
              <div className="ml-4 pl-4 border-l border-slate-200 flex items-center gap-3">
                 <button 
                    onClick={toggleLang}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                 >
                     <Globe className="w-3.5 h-3.5" />
                     {lang === 'en' ? 'EN' : '中'}
                 </button>

                 {user ? (
                   <div className="relative">
                      <button 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-50 transition-colors"
                      >
                         <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center border border-indigo-200">
                           <span className="font-semibold text-sm">{user.displayName.charAt(0).toUpperCase()}</span>
                         </div>
                      </button>
                      
                      {isUserMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 animate-scale-in">
                              <div className="px-4 py-3 border-b border-slate-50">
                                  <p className="text-sm font-medium text-slate-900 truncate">{user.displayName}</p>
                                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                              </div>
                              <button 
                                onClick={() => { logout(); setIsUserMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                  <LogOut className="w-4 h-4" />
                                  {t.nav.logout}
                              </button>
                          </div>
                        </>
                      )}
                   </div>
                 ) : (
                   <button
                     onClick={() => setShowAuthModal(true)}
                     className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
                   >
                     <LogIn className="w-4 h-4" />
                     {t.nav.signIn}
                   </button>
                 )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden gap-3">
              <button 
                onClick={toggleLang}
                className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-slate-600 border border-slate-200 rounded"
              >
                  {lang === 'en' ? 'EN' : '中'}
              </button>
              
              {user ? (
                   <div className="relative">
                      <button 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center border border-indigo-200"
                      >
                          <span className="font-semibold text-sm">{user.displayName.charAt(0).toUpperCase()}</span>
                      </button>
                      {isUserMenuOpen && (
                        <>
                           <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
                           <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                              <div className="px-4 py-3 border-b border-slate-50">
                                  <p className="text-sm font-medium text-slate-900 truncate">{user.displayName}</p>
                              </div>
                              <button 
                                onClick={() => { logout(); setIsUserMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                  <LogOut className="w-4 h-4" />
                                  {t.nav.logout}
                              </button>
                           </div>
                        </>
                      )}
                   </div>
              ) : (
                <button
                    onClick={() => setShowAuthModal(true)}
                    className="p-2 text-slate-600"
                >
                    <LogIn className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </div>
                </button>
              ))}
              {!user && (
                  <button
                    onClick={() => { setShowAuthModal(true); setIsMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50"
                  >
                      <div className="flex items-center gap-3">
                        <LogIn className="w-5 h-5" />
                        {t.nav.signIn}
                      </div>
                  </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Render content based on tab */}
        {activeTab === AppMode.MEDIA_DOWNLOAD ? (
           <MediaTools lang={lang} />
        ) : (
           <div className="space-y-8 animate-fade-in">
              <div className="text-center space-y-2 mb-8">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                    {activeTab === AppMode.COMPRESS ? t.hero.compressTitle : t.hero.convertTitle}
                  </h1>
                  <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                    {activeTab === AppMode.COMPRESS 
                        ? t.hero.compressDesc
                        : t.hero.convertDesc}
                  </p>
              </div>

              <ImageUploader onFilesSelected={handleFilesSelected} lang={lang} />
              
              <Compressor 
                files={files} 
                setFiles={setFiles} 
                mode={activeTab === AppMode.COMPRESS ? 'compress' : 'convert'} 
                lang={lang}
              />
           </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                 <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white">
                        <Aperture className="w-4 h-4" />
                    </div>
                    <span className="text-slate-900 font-semibold">{t.nav.appName}</span>
                 </div>
                 <p className="text-xs text-slate-500 mt-3 max-w-sm leading-relaxed">
                   {t.footer.desc}
                 </p>
              </div>
              <div className="text-xs text-slate-400">
                &copy; {new Date().getFullYear()} Orion Compress X. {t.footer.rights}
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
