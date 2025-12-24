import { User } from "../types";

export type UsageType = 'compress' | 'convert' | 'media';

interface DailyUsage {
  date: string;
  compress: number;
  convert: number;
  media: number;
}

const STORAGE_KEY = 'orion_usage_v1';

const getUsage = (): DailyUsage => {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (stored) {
    const parsed: DailyUsage = JSON.parse(stored);
    if (parsed.date === today) {
      return parsed;
    }
  }

  // Reset or initialize
  return {
    date: today,
    compress: 0,
    convert: 0,
    media: 0
  };
};

const saveUsage = (usage: DailyUsage) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
};

export const checkLimit = (type: UsageType, user: User | null): boolean => {
  const usage = getUsage();
  
  // Limits
  // Guest: 5 compress, 5 convert, 1 video
  // User: Unlimited compress, Unlimited convert, 5 video
  
  if (!user) {
    if (type === 'compress' && usage.compress >= 5) return false;
    if (type === 'convert' && usage.convert >= 5) return false;
    if (type === 'media' && usage.media >= 1) return false;
  } else {
    // Logged in user limits
    if (type === 'media' && usage.media >= 5) return false;
    // Compress and convert are unlimited for logged in users
  }

  return true;
};

export const incrementUsage = (type: UsageType) => {
  const usage = getUsage();
  usage[type]++;
  saveUsage(usage);
};

export const getRemainingCount = (type: UsageType, user: User | null): number | string => {
    const usage = getUsage();
    if (!user) {
        if (type === 'compress') return Math.max(0, 5 - usage.compress);
        if (type === 'convert') return Math.max(0, 5 - usage.convert);
        if (type === 'media') return Math.max(0, 1 - usage.media);
    } else {
        if (type === 'media') return Math.max(0, 5 - usage.media);
        return '∞';
    }
    return 0;
};
