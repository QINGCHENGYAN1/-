
import { Song, MusicSource, RemoteStorageProvider, LoginMethod } from '../types';

// Sample Lyrics
const SAMPLE_LRC = `[00:00.00]Instrumental Intro
[00:05.50]Neon lights are calling me
[00:10.20]In the city of digital dreams
[00:15.80]Data streams flow endlessly
[00:20.40]Nothing is quite what it seems
[00:25.00]Running through the cyber night
[00:30.00]Chasing phantoms in the light
[00:35.00](Chorus)
[00:36.00]Oh, cyber runner
[00:40.00]Never stop, never look back
[00:45.00]The future is a heart attack
[00:50.00]...
`;

const CHINESE_LRC = `[00:00.00]前奏
[00:04.00]云端的风还在吹
[00:08.00]数据的雨在下坠
[00:12.00]我们在虚拟世界
[00:16.00]寻找真实的慰藉
[00:20.00]看不见的连接线
[00:24.00]缠绕你我的指尖
[00:28.00](副歌)
[00:30.00]百度的云 存着回忆
[00:34.00]永远不会 随风而去
`;

// --- Online Music Mock ---

const MOCK_ONLINE_SONGS: Song[] = [
  {
    id: 'ol_1',
    title: 'Neon Lights',
    artist: 'Cyber Runner',
    album: 'Night City',
    duration: 185,
    source: MusicSource.ONLINE,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 
    coverUrl: 'https://picsum.photos/200/200?random=1',
    lyrics: SAMPLE_LRC
  },
  {
    id: 'ol_2',
    title: 'Dreaming High',
    artist: 'The Clouds',
    album: 'Skyward',
    duration: 210,
    source: MusicSource.ONLINE,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverUrl: 'https://picsum.photos/200/200?random=2',
    lyrics: "[00:00.00]No lyrics available"
  },
  {
    id: 'ol_3',
    title: 'Retro Wave',
    artist: 'Synth Master',
    album: '1984',
    duration: 240,
    source: MusicSource.ONLINE,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverUrl: 'https://picsum.photos/200/200?random=3',
    lyrics: SAMPLE_LRC
  }
];

export const searchOnlineSongs = async (keyword: string): Promise<Song[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!keyword) resolve(MOCK_ONLINE_SONGS);
      resolve(MOCK_ONLINE_SONGS.filter(s => s.title.toLowerCase().includes(keyword.toLowerCase())));
    }, 500);
  });
};

export const getRecommendedPlaylists = async () => {
    return []; // Cleared mock recommended playlists
};

// --- NAS / Cloud Mock Implementation ---

export class MockCloudProvider implements RemoteStorageProvider {
  id: string;
  name: string;
  type: 'NAS' | 'CLOUD';
  isLoggedIn: boolean = false;
  icon: string;
  supportedMethods: LoginMethod[] = ['PASSWORD'];

  constructor(id: string, name: string, type: 'NAS' | 'CLOUD', icon?: string) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.icon = icon || (type === 'NAS' ? '🏠' : '☁️');
  }

  async loginWithPassword(user: string, pass: string): Promise<boolean> {
    console.log(`Logging in to ${this.name} with user: ${user}`);
    return new Promise(resolve => setTimeout(() => {
      this.isLoggedIn = true;
      resolve(true);
    }, 1000));
  }

  async listMusicFiles(path: string = '/'): Promise<Song[]> {
    if (!this.isLoggedIn) return [];
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: `nas_${this.id}_1`,
            title: `Backup Song 1 (${this.name})`,
            artist: 'Unknown',
            album: 'My Backup',
            duration: 200,
            source: this.type === 'NAS' ? MusicSource.NAS : MusicSource.CLOUD,
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
            coverUrl: 'https://picsum.photos/200/200?random=20',
            lyrics: SAMPLE_LRC
          },
          {
            id: `nas_${this.id}_2`,
            title: `Demo Track 2 (${this.name})`,
            artist: 'Demo Artist',
            album: 'Demo Album',
            duration: 150,
            source: this.type === 'NAS' ? MusicSource.NAS : MusicSource.CLOUD,
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
            coverUrl: 'https://picsum.photos/200/200?random=21'
          }
        ]);
      }, 600);
    });
  }

  async getMusicStreamUrl(fileId: string): Promise<string> {
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  }
}

export class BaiduCloudProvider extends MockCloudProvider {
    supportedMethods: LoginMethod[] = ['QRCODE', 'PHONE', 'PASSWORD'];
    private qrScanCount = 0;
    private validCode = '888888'; // Mock verification code

    constructor() {
        super('baidu_disk', '百度网盘', 'CLOUD', '🐻');
    }

    // New: Mock sending SMS code
    async sendPhoneVerification(phone: string): Promise<boolean> {
        console.log(`Sending verification code to ${phone}`);
        return new Promise(resolve => setTimeout(() => {
            // In a real app, this triggers an SMS. 
            // Here we just resolve true, and the UI will tell the user what the mock code is.
            resolve(true); 
        }, 1000));
    }

    async loginWithPhone(phone: string, code: string): Promise<boolean> {
         console.log(`Logging in to Baidu with phone: ${phone}, code: ${code}`);
         return new Promise((resolve, reject) => setTimeout(() => {
             // Validate mock code
             if (code === this.validCode || code === '123456') {
                 this.isLoggedIn = true;
                 resolve(true);
             } else {
                 resolve(false);
             }
         }, 1000));
    }

    async getLoginQRCode(): Promise<string> {
        this.qrScanCount = 0;
        // Mock QR Code API
        return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BaiduNetdiskLogin_${Date.now()}`;
    }

    async checkQRCodeStatus(): Promise<boolean> {
        // Mock polling: returns true after 3 checks (approx 3-6 seconds)
        this.qrScanCount++;
        return new Promise(resolve => {
            setTimeout(() => {
                // Simulate: Wait 2 cycles, then "Scanned", then "Login"
                if (this.qrScanCount > 3) {
                    this.isLoggedIn = true;
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 500);
        });
    }

    async listMusicFiles(path: string = '/'): Promise<Song[]> {
        if (!this.isLoggedIn) return [];
        
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    {
                        id: 'bd_1',
                        title: 'Cloud Symphony',
                        artist: 'Baidu AI',
                        album: 'Netdisk Hits',
                        duration: 190,
                        source: MusicSource.CLOUD,
                        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
                        coverUrl: 'https://picsum.photos/200/200?random=30',
                        lyrics: CHINESE_LRC
                    },
                    {
                        id: 'bd_2',
                        title: 'Data Stream',
                        artist: 'Network',
                        album: 'Uploads',
                        duration: 220,
                        source: MusicSource.CLOUD,
                        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
                        coverUrl: 'https://picsum.photos/200/200?random=31',
                        lyrics: CHINESE_LRC
                    }
                ]);
            }, 800);
        });
    }
}

export class SMBNasProvider extends MockCloudProvider {
    supportedMethods: LoginMethod[] = ['SMB'];

    constructor() {
        super('smb_nas', 'Home NAS (SMB)', 'NAS', '🗄️');
    }

    async loginWithSMB(host: string, share: string, user: string, pass: string): Promise<boolean> {
        console.log(`Connecting to SMB Share: \\\\${host}\\${share} as ${user}`);
        return new Promise(resolve => setTimeout(() => {
            this.isLoggedIn = true;
            resolve(true);
        }, 1500));
    }

    async listMusicFiles(path: string = '/'): Promise<Song[]> {
        if (!this.isLoggedIn) return [];
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    {
                        id: 'smb_1',
                        title: 'NAS Track 01',
                        artist: 'Unknown',
                        album: 'SMB Share',
                        duration: 240,
                        source: MusicSource.NAS,
                        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
                        coverUrl: 'https://picsum.photos/200/200?random=50'
                    }
                ]);
            }, 500);
        });
    }
}
