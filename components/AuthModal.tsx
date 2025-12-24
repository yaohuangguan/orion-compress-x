import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import { Language, translations } from '../translations';

interface AuthModalProps {
  lang: Language;
}

const AuthModal: React.FC<AuthModalProps> = ({ lang }) => {
  const { showAuthModal, setShowAuthModal, login, register } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(''); // Acts as 'inputAccount' for login
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConf, setPasswordConf] = useState('');

  const t = translations[lang].auth;

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== passwordConf) {
            throw new Error(lang === 'zh' ? '两次输入的密码不一致' : 'Passwords do not match');
        }
        await register({
            displayName,
            email, // The API expects 'email' key
            phone,
            password,
            passwordConf
        });
      } else {
        await login({
            email, // The API expects 'email' key even for phone input
            password
        });
      }
      // Reset form on success
      setDisplayName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setPasswordConf('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'signin' ? 'signup' : 'signin');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={() => setShowAuthModal(false)}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
                {mode === 'signin' ? t.signInTitle : t.signUpTitle}
            </h2>
            <button 
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Body */}
        <div className="p-6">
            {error && (
                <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {mode === 'signup' && (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">{t.nameLabel}</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder={t.namePlaceholder}
                                required
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                        {mode === 'signin' ? t.accountLabel : t.emailLabel}
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder={mode === 'signin' ? t.accountPlaceholder : t.emailPlaceholder}
                            required
                        />
                    </div>
                </div>

                {mode === 'signup' && (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">{t.phoneLabel} <span className="text-slate-400 font-normal lowercase">({t.optional})</span></label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="+1234567890"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">{t.passwordLabel}</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                {mode === 'signup' && (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">{t.confirmPasswordLabel}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                value={passwordConf}
                                onChange={e => setPasswordConf(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                )}

                <Button 
                    type="submit" 
                    className="w-full mt-4 py-3" 
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (mode === 'signin' ? t.signInBtn : t.signUpBtn)}
                </Button>

                <div className="text-center mt-4">
                    <p className="text-sm text-slate-500">
                        {mode === 'signin' ? t.noAccount : t.hasAccount}
                        <button 
                            type="button"
                            onClick={toggleMode}
                            className="ml-1 text-indigo-600 font-semibold hover:underline focus:outline-none"
                        >
                            {mode === 'signin' ? t.signUpLink : t.signInLink}
                        </button>
                    </p>
                </div>

            </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
