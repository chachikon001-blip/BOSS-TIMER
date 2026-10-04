import { Boss } from '../types/boss';

export const SPAWN_COLOR_GREEN = '#d9ead3';  // 100% บอสเกิด 100%
export const SPAWN_COLOR_YELLOW = '#fff2cc'; // 50%  โอกาสบอสเกิด 50%
export const SPAWN_COLOR_RED = '#f4cccc';    // 33%  โอกาสบอสเกิด 33%

// Mapping from user's Google Sheet:
export const SHEET_BOSS_COLOR_CONFIG: Record<string, { spawnChance: number; spawnColor: string; sheetRow: number }> = {
  // Image 1: Yellow (50% โอกาสเกิด)
  'เฟลิส': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 2 },
  'felis': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 2 },
  'เทมเพสต์': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 3 },
  'valefar': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 3 },
  'เอนคูรา': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 4 },
  'enkura': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 4 },
  'บัลโบ': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 5 },
  'balbo': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 5 },
  'เคลซอส': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 6 },
  'kelsus': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 6 },
  'พันนาโรด': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 8 },
  'pannarod': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 8 },
  'แกเร็ธ': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 9 },
  'gahareth': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 9 },
  'เชอร์ทูบา': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 11 },
  'chertuba': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 11 },
  'ฮิชิโลเม': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 12 },
  'hisilrome': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 12 },
  'ทรอมบา': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 18 },
  'tromba': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 18 },
  'บาซิลา': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 19 },
  'basila': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 19 },
  'ทัลคิน': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 21 },
  'talkin': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 21 },
  'เรปิโร': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 22 },
  'repiro': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 22 },
  'มาทูรา': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 23 },
  'matura': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 23 },
  'เบรก้า': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 29 },
  'breka': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 29 },
  'ฟลินท์': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 33 },
  'flynt': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 33 },
  'เซลลู': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 39 },
  'selu': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 39 },
  'คาบริโอ': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 41 },
  'cabrio': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 41 },
  'ฮาร์ป': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 42 },
  'haff': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 42 },
  'แอนดราส': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 43 },
  'andras': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 43 },
  'ทานาทอส': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 45 },
  'tanatos': { spawnChance: 50, spawnColor: SPAWN_COLOR_YELLOW, sheetRow: 45 },

  // Image 3: Green (100% บอสเกิด)
  'ซาบัน': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 7 },
  'savan': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 7 },
  'ครูม่าหนองน้ำ': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 10 },
  'mutated cruma': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 10 },
  'เบฮีมอธ': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 13 },
  'behemoth': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 13 },
  'ทิมิเนล': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 14 },
  'timiniel': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 14 },
  'ครูม่าปนเปื้อน': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 15 },
  'cruma4': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 15 },
  'กลาคิ': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 16 },
  'glaki': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 16 },
  'คาทาน': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 17 },
  'katan': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 17 },
  'ทิมิทริส': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 20 },
  'timitris': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 20 },
  'โครูน': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 24 },
  'coroon': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 24 },
  'ทาลาคิน': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 25 },
  'talakin': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 25 },
  'เมดูซ่า': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 26 },
  'medusa': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 26 },
  'พัน ดรายด์': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 27 },
  "pan'dra'eed": { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 27 },
  'สตัน': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 28 },
  'stonegeist': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 28 },
  'ชาร์ก้า': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 30 },
  'sarka': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 30 },
  'ลิลลี่': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 31 },
  'lily': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 31 },
  'กระจก': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 32 },
  'mirror': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 32 },
  'แลนเดอร์': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 34 },
  'landor': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 34 },
  'ซามูเอล': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 35 },
  'samuel': { spawnChance: 100, spawnColor: SPAWN_COLOR_GREEN, sheetRow: 35 },

  // Image 2: Red (33% โอกาสเกิด)
  'คอร์ซัสเซปเตอร์': { spawnChance: 33, spawnColor: SPAWN_COLOR_RED, sheetRow: 36 },
  'core': { spawnChance: 33, spawnColor: SPAWN_COLOR_RED, sheetRow: 36 },
  'มด 3': { spawnChance: 33, spawnColor: SPAWN_COLOR_RED, sheetRow: 37 },
  'ant3': { spawnChance: 33, spawnColor: SPAWN_COLOR_RED, sheetRow: 37 },
  'ดราก้อนบีสต์': { spawnChance: 33, spawnColor: SPAWN_COLOR_RED, sheetRow: 38 },
  'db': { spawnChance: 33, spawnColor: SPAWN_COLOR_RED, sheetRow: 38 },
  'ออร์เฟน': { spawnChance: 33, spawnColor: SPAWN_COLOR_RED, sheetRow: 40 },
  'orfen': { spawnChance: 33, spawnColor: SPAWN_COLOR_RED, sheetRow: 40 },
  'โอลด์คุส': { spawnChance: 33, spawnColor: SPAWN_COLOR_RED, sheetRow: 44 },
  'olkuth': { spawnChance: 33, spawnColor: SPAWN_COLOR_RED, sheetRow: 44 },
  'ลาฮา': { spawnChance: 33, spawnColor: SPAWN_COLOR_RED, sheetRow: 46 },
  'rahha': { spawnChance: 33, spawnColor: SPAWN_COLOR_RED, sheetRow: 46 },
};

/**
 * Returns default spawn chance and color for a boss name if not already set
 */
export function getBossColorInfo(boss: Partial<Boss>): { spawnChance: number; spawnColor: string; sheetRow?: number } {
  if (boss.spawnChance !== undefined && boss.spawnColor) {
    return {
      spawnChance: boss.spawnChance,
      spawnColor: boss.spawnColor,
      sheetRow: boss.sheetRowIndex,
    };
  }

  const name = (boss.name || '').toLowerCase();
  for (const [key, conf] of Object.entries(SHEET_BOSS_COLOR_CONFIG)) {
    if (name.includes(key.toLowerCase())) {
      return {
        spawnChance: boss.spawnChance ?? conf.spawnChance,
        spawnColor: boss.spawnColor || conf.spawnColor,
        sheetRow: boss.sheetRowIndex ?? conf.sheetRow,
      };
    }
  }

  // Default fallback
  const chance = boss.spawnChance ?? 100;
  let color = boss.spawnColor;
  if (!color) {
    if (chance <= 35) color = SPAWN_COLOR_RED;
    else if (chance <= 65) color = SPAWN_COLOR_YELLOW;
    else color = SPAWN_COLOR_GREEN;
  }

  return { spawnChance: chance, spawnColor: color, sheetRow: boss.sheetRowIndex };
}

/**
 * Enriches boss list with spawnChance and spawnColor
 */
export function enrichBossColors(bosses: Boss[]): Boss[] {
  return bosses.map((b) => {
    const info = getBossColorInfo(b);
    return {
      ...b,
      spawnChance: b.spawnChance ?? info.spawnChance,
      spawnColor: b.spawnColor || info.spawnColor,
      sheetRowIndex: b.sheetRowIndex ?? info.sheetRow,
    };
  });
}
