
export enum MusicSource {
  LOCAL = 'LOCAL',
  ONLINE = 'ONLINE',
  NAS = 'NAS',
  CLOUD = 'CLOUD'
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  url: string;
  coverUrl?: string;
  source: MusicSource;
  file?: File; // For local files
  lyrics?: string; // LRC format content
}

export interface Playlist {
  id: string;
  name: string;
  coverUrl: string;
  songs: Song[];
}

export interface EqualizerBand {
  frequency: string;
  gain: number; // -12 to 12
}

export type Language = 'en' | 'zh';

export enum VisualizerMode {
  OFF = 'OFF',
  BARS = 'BARS',
  WAVEFORM = 'WAVEFORM',
  CIRCLE_BARS = 'CIRCLE_BARS',
  SYMMETRICAL = 'SYMMETRICAL',
  PARTICLES = 'PARTICLES',
  OSCILLOSCOPE = 'OSCILLOSCOPE',
  HEATMAP = 'HEATMAP',
  CIRCULAR_WAVE = 'CIRCULAR_WAVE',
  FILLED_MOUNTAIN = 'FILLED_MOUNTAIN',
  GALAXY = 'GALAXY',
  DNA = 'DNA',
  MATRIX = 'MATRIX',
  HEXAGON = 'HEXAGON'
}

export type LoginMethod = 'PASSWORD' | 'PHONE' | 'QRCODE' | 'SMB';

// NAS / Cloud Interface
export interface RemoteStorageProvider {
  id: string;
  name: string;
  type: 'NAS' | 'CLOUD';
  isLoggedIn: boolean;
  icon: string; // Emoji or URL
  supportedMethods: LoginMethod[];
  
  // Login Methods
  loginWithPassword(account: string, password: string): Promise<boolean>;
  
  // Phone Login Flow
  sendPhoneVerification?(phone: string): Promise<boolean>; // Sends code
  loginWithPhone?(phone: string, code: string): Promise<boolean>; // Verifies code
  
  loginWithSMB?(host: string, share: string, user: string, pass: string): Promise<boolean>;
  
  getLoginQRCode?(): Promise<string>; // Returns QR image URL
  checkQRCodeStatus?(): Promise<boolean>; // Returns true if scanned and confirmed

  // File System
  listMusicFiles(path?: string): Promise<Song[]>;
  getMusicStreamUrl(fileId: string): Promise<string>;
}

export interface UserSettings {
  language: Language;
  theme: 'dark' | 'light';
  volume: number;
  visualizerMode: VisualizerMode;
  visualizerColor1: string;
  visualizerColor2: string;
}
