export type ServerType = 'main' | 'sub';

export type BossStatus = 'alive' | 'soon' | 'dead';

export interface Boss {
  id: string;
  name: string;
  server: ServerType;
  serverTag?: string; // e.g. "T3", "S1", "Main"
  location: string;
  respawnMinutes: number; // e.g., 240 for 4 hours
  level?: number;
  lastKilledAt: string | null; // ISO string
  nextSpawnAt: string | null;  // ISO string
  killedBy?: string;
  notifiedStages: number[]; // e.g. [10, 5, 3, 1] that have already fired
  notes?: string;
  dropItems?: string[];
  pinned?: boolean;
  bossNumber?: number;
  spawnChance?: number; // e.g. 100, 50, 33 (%)
  spawnColor?: string;  // e.g. '#d9ead3' (green 100%), '#fff2cc' (yellow 50%), '#f4cccc' (red 33%)
  sheetRowIndex?: number;
}

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'member';
  passwordHash?: string;
  password?: string;
  createdAt: string;
  lastLoginAt?: string;
  active: boolean;
  status?: 'active' | 'pending' | 'rejected';
}

export interface NotificationSettings {
  enabled: boolean;
  notifyAtMinutes: number[]; // [10, 5, 3, 1]
  soundType: 'synth_chime' | 'warning_siren' | 'horn' | 'sci_fi' | '8bit' | 'tts_thai' | 'custom';
  soundVolume: number; // 0 to 1
  ttsLanguage?: 'thai_only' | 'english_only' | 'all'; // ตัวเลือกภาษาการอ่าน: ไทยอย่างเดียว, อังกฤษอย่างเดียว, หรือทั้งหมด
  ttsSpeed?: number; // ความเร็วการอ่าน (default: 1.05)
  customSoundUrl?: string;

  // Discord Channel 1: Top 30 Nearest Bosses
  discordTop30WebhookUrl?: string;
  discordTop30Enabled?: boolean;

  // Discord Channel 2: Impending Boss Spawn Alerts (10, 5, 3, 1 mins)
  discordSpawnWebhookUrl?: string;
  discordSpawnEnabled?: boolean;
  discordSpawnMinutes?: number[]; // [10, 5, 3, 1]

  // Backward-compatible Discord properties
  discordWebhookUrl?: string;
  discordEnabled?: boolean;

  // LINE Channel
  lineWebhookUrl: string; // LINE notify or incoming webhook URL
  lineEnabled: boolean;

  browserPushEnabled: boolean;
  mainServerTag?: string; // default e.g. "T3"
  subServerTag?: string;  // default e.g. "S1"
  appLanguage?: 'th' | 'en'; // ภาษาของระบบ: ไทย (th) หรือ อังกฤษ (en)
}

export interface SheetConfig {
  sheetId: string;
  gid: string;
  mainGid: string; // '1587945636'
  subGid: string;  // '82332950'
  mainTabName?: string; // 'Boss Time T3'
  subTabName?: string;  // 'BossTime_invasion'
  autoSync: boolean;
  syncIntervalSeconds: number;
  lastSyncedAt: string | null;
}

export interface AppStateData {
  bosses: Boss[];
  users: UserAccount[];
  settings: NotificationSettings;
  sheetConfig: SheetConfig;
  lastUpdated: string;
}
