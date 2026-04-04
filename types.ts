export enum AppMode {
  COMPRESS = 'COMPRESS',
  CONVERT = 'CONVERT',
  MEDIA_DOWNLOAD = 'MEDIA_DOWNLOAD',
  MERGE_PDF = 'MERGE_PDF'
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  vip?: boolean;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  processedUrl?: string;
  processedSize?: number;
  format?: string; // e.g., 'image/jpeg'
  name: string;
}

export interface MediaDownloadTask {
  id: string;
  url: string;
  type: 'mp4' | 'mp3';
  status: 'idle' | 'fetching' | 'converting' | 'completed' | 'error';
  progress: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}
