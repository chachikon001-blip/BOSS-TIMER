import { Boss } from '../types/boss';
import { getAccessToken, setAccessToken } from './firebase';
import { rawBossList } from '../data/defaultBosses';
import { getApiUrl } from './apiConfig';
import { areBossNamesMatching, deduplicateBossList } from '../utils/bossDeduplication';
import { getBossColorInfo } from '../utils/bossColorMap';

export interface SheetRowData {
  name: string;
  server: 'main' | 'sub';
  respawnMinutes: number;
  lastKilledAt: string;
  nextSpawnAt: string;
  location: string;
}

/**
 * Fetch public Google Sheet CSV (or through backend proxy)
 */
export async function fetchPublicGoogleSheet(sheetId: string, gid = '0'): Promise<string[][]> {
  const urls = [
    getApiUrl(`/api/sheets/proxy?sheetId=${encodeURIComponent(sheetId)}&gid=${encodeURIComponent(gid)}`),
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        if (text && !text.includes('<!DOCTYPE html>')) {
          return parseCSV(text);
        }
      }
    } catch {
      // try next
    }
  }

  throw new Error('ไม่สามารถดึงข้อมูลจาก Google Sheet ได้โดยตรง กรุณาตรวจสอบสิทธิ์การแชร์หรือเข้าสู่ระบบด้วย Google');
}

/**
 * Parse CSV text into 2D array
 */
export function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  return lines.map(line => {
    const row: string[] = [];
    let inQuotes = false;
    let curVal = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(curVal.trim().replace(/^"|"$/g, ''));
        curVal = '';
      } else {
        curVal += char;
      }
    }
    row.push(curVal.trim().replace(/^"|"$/g, ''));
    return row;
  });
}

/**
 * Read spreadsheet using Google Sheets REST API (OAuth)
 */
export async function fetchSheetsDataWithOAuth(sheetId: string, range = 'A1:K100'): Promise<string[][]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบ Google เพื่อเข้าถึงสิทธิ์ Google Sheets');
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      setAccessToken(null);
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `HTTP ${res.status}: ไม่สามารถอ่านชีตได้`);
  }

  const data = await res.json();
  return (data.values as string[][]) || [];
}

/**
 * Helper to parse Date string from Column C (DD/MM/YYYY or YYYY-MM-DD)
 */
function parseDateParts(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed === '-' || trimmed.toLowerCase().includes('ไม่ทราบ')) return null;

  const parts = trimmed.split(/[/.-]/);
  if (parts.length === 3) {
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    // If parts[0] is 4 digits: YYYY-MM-DD
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }

    // Convert Buddhist era if > 2400 (e.g. 2569 -> 2026)
    if (year > 2400) {
      year -= 543;
    } else if (year < 100) {
      year += 2000;
    }

    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }
  return null;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Build 2D array matching exact Google Sheets layout:
 * Column A (0):  ลำดับ / Boss Number (เช่น 25, 24, 21, 13...)
 * Column B (1):  Name (ชื่อบอส)
 * Column C (2):  Hr. (รอบเวลาเกิดเป็น ชม.)
 * Column D (3):  วันที่ตาย (DD/MM/YYYY)
 * Column E (4):  ชม (ชั่วโมงที่ตาย 0-23)
 * Column F (5):  นาที (นาทีที่ตาย 0-59)
 * Column G (6):  Update (checkbox: FALSE)
 * Column H (7):  Respawn GMT+7 (HH:mm)
 * Column I (8):  Respawn GMT+8 (HH:mm)
 * Column J (9):  เรียงบอส (นาทีคงเหลือ หรือค่าคำนวณ)
 * Column K (10): วันที่เเละเวลาเกิดของบอส (DD/MM/YYYY HH:mm)
 * Column L (11): SV. (T3, Invasion, etc.)
 */
function buildSheetRows(bossList: Boss[], includeHeader: boolean = true): (string | number)[][] {
  // Row 1: Header row (Col A is blank, Col B is Name, ..., Col L is SV.)
  const rows: (string | number)[][] = [];

  if (includeHeader) {
    rows.push([
      '',
      'Name',
      'Hr.',
      'วันที่ตาย',
      'ชม',
      'นาที',
      'Update',
      'Respawn GMT+7',
      'Respawn GMT+8',
      'เรียงบอส',
      'วันที่เเละเวลาเกิดของบอส',
      'SV.',
    ]);
  }

  const nowMs = Date.now();

  bossList.forEach((b, index) => {
    // Preserve boss number or fallback to index
    const bossNum = b.bossNumber !== undefined ? b.bossNumber : (index + 1);
    const respawnHours = (b.respawnMinutes / 60).toFixed(1).replace(/\.0$/, '');
    const serverLabel = b.serverTag || (b.server === 'main' ? 'T3' : 'Invasion');

    let deathDateStr = '';
    let deathHourStr = '';
    let deathMinStr = '';
    let respawnGmt7 = 'ไม่ทราบเวลา';
    let respawnGmt8 = 'ไม่ทราบเวลา';
    let fullSpawnStr = 'ไม่ทราบเวลา';
    let minutesLeftStr = '-';

    if (b.lastKilledAt) {
      const d = new Date(b.lastKilledAt);
      if (!isNaN(d.getTime())) {
        const parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).formatToParts(d);

        const getVal = (type: string) => parts.find(p => p.type === type)?.value || '';
        deathDateStr = `${getVal('day')}/${getVal('month')}/${getVal('year')}`;
        deathHourStr = parseInt(getVal('hour'), 10).toString();
        deathMinStr = parseInt(getVal('minute'), 10).toString();
      }
    }

    if (b.nextSpawnAt) {
      const sp = new Date(b.nextSpawnAt);
      if (!isNaN(sp.getTime())) {
        const diffMinutes = Math.round((sp.getTime() - nowMs) / 60000);
        minutesLeftStr = diffMinutes.toString();

        respawnGmt7 = sp.toLocaleTimeString('th-TH', {
          timeZone: 'Asia/Bangkok',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        respawnGmt8 = sp.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Singapore',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        const spParts = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).formatToParts(sp);

        const getSp = (type: string) => spParts.find(p => p.type === type)?.value || '';
        fullSpawnStr = `${getSp('day')}/${getSp('month')}/${getSp('year')} ${getSp('hour')}:${getSp('minute')}`;
      }
    }

    rows.push([
      bossNum,        // Col A: ลำดับบอส
      b.name,         // Col B: Name
      respawnHours,   // Col C: Hr.
      deathDateStr,   // Col D: วันที่ตาย
      deathHourStr,   // Col E: ชม
      deathMinStr,    // Col F: นาที
      'FALSE',        // Col G: Update
      respawnGmt7,    // Col H: Respawn GMT+7
      respawnGmt8,    // Col I: Respawn GMT+8
      minutesLeftStr, // Col J: เรียงบอส
      fullSpawnStr,   // Col K: วันที่เเละเวลาเกิดของบอส
      serverLabel,    // Col L: SV.
    ]);
  });

  return rows;
}

/**
 * Write Boss records to Google Sheets (MANDATORY User Confirmation handled by caller)
 * Matching user's exact sheet layout:
 * Column A: ลำดับบอส (25, 24, 21...)
 * Column B: Name
 * Column C: Hr.
 * Column D: วันที่ตาย
 * Column E: ชม
 * Column F: นาที
 * Column G: Update
 * Column H: Respawn GMT+7
 * Column I: Respawn GMT+8
 * Column J: เรียงบอส
 * Column K: วันที่เเละเวลาเกิดของบอส
 * Column L: SV.
 */
export async function writeBossesToGoogleSheet(
  sheetId: string, 
  bosses: Boss[], 
  targetServer: 'main' | 'sub' | 'all' = 'main',
  customTabName?: string
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบด้วยบัญชี Google เพื่อบันทึกข้อมูลลงชีต');
  }

  const writeTab = async (tabName: string, bossList: Boss[]) => {
    if (!bossList || bossList.length === 0) return;
    const rows = buildSheetRows(bossList);
    const range = `'${tabName}'!A1:L${rows.length}`;

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: rows,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `เกิดข้อผิดพลาดในการบันทึกลงชีตแท็บ ${tabName} (${res.status})`);
    }
  };

  if (targetServer === 'all') {
    const mainBosses = bosses.filter(b => b.server === 'main');
    const subBosses = bosses.filter(b => b.server === 'sub');
    if (mainBosses.length > 0) {
      await writeTab('Boss Time T3', mainBosses);
    }
    if (subBosses.length > 0) {
      await writeTab('BossTime_invasion', subBosses);
    }
  } else if (targetServer === 'sub') {
    const subBosses = bosses.filter(b => b.server === 'sub');
    await writeTab(customTabName || 'BossTime_invasion', subBosses.length > 0 ? subBosses : bosses);
  } else {
    // main server
    const mainBosses = bosses.filter(b => b.server === 'main');
    await writeTab(customTabName || 'Boss Time T3', mainBosses.length > 0 ? mainBosses : bosses);
  }

  return true;
}

/**
 * Parse Google Sheet rows into Boss objects according to user format:
 * Column A (0): Name (ชื่อบอส)
 * Column B (1): Hr. (รอบเวลาเกิดใหม่เป็น ชม.)
 * Column C (2): วันที่ตาย (DD/MM/YYYY)
 * Column D (3): ชมที่ตาย (Hour 0-23)
 * Column E (4): นาทีที่ตาย (Minute 0-59)
 * Column F (5): Update (Checkbox)
 * Column G (6): เวลาเกิดใหม่ (Respawn GMT+7 e.g. 19:31)
 * Column J (9): วันที่เเละเวลาเกิดของบอส (Full Datetime e.g. 26/09/2026 19:31)
 * Column K (10): SV. (Server Tag: T3, S1, Invasion)
 */
export function convertSheetRowsToBosses(
  rows: string[][], 
  fallbackServer: 'main' | 'sub' = 'main',
  existingBosses: Boss[] = []
): Boss[] {
  if (!rows || rows.length === 0) return [];

  // Filter out header and empty rows
  const cleanRows = rows.filter(r => {
    if (!r || r.length < 2) return false;
    const col0 = (r[0] || '').trim().toLowerCase();
    const col1 = (r[1] || '').trim().toLowerCase();
    if (col0 === 'name' || col0.includes('ชื่อบอส') || col1 === 'name' || col1.includes('ชื่อบอส')) {
      return false;
    }
    return (r[0] && r[0].trim().length > 0) || (r[1] && r[1].trim().length > 0);
  });

  const bossesList: Boss[] = [];

  cleanRows.forEach((r, index) => {
    // Check if Column B (index 1) is Name (Column A is Index number or empty)
    const col0Trimmed = (r[0] || '').trim();
    const col1Trimmed = (r[1] || '').trim();

    const col0IsIndex = !col0Trimmed || /^\d+$/.test(col0Trimmed);
    const col1HasText = /[a-zA-Z\u0E00-\u0E7F]/.test(col1Trimmed);
    const isColBName = col0IsIndex && col1HasText;

    const nameIdx = isColBName ? 1 : 0;
    const hrIdx = isColBName ? 2 : 1;
    const dateIdx = isColBName ? 3 : 2;
    const hourIdx = isColBName ? 4 : 3;
    const minIdx = isColBName ? 5 : 4;
    const spawnTimeIdx = isColBName ? 7 : 6;
    const fullSpawnIdx = isColBName ? 10 : 9;
    const svIdx = isColBName ? 11 : 10;

    const rawName = (r[nameIdx] || '').replace(/\s+/g, ' ').trim();
    if (!rawName || rawName.toLowerCase() === 'name' || rawName.includes('ชื่อบอส')) {
      return;
    }
    const name = rawName;

    // 2. เวลาเกิดใหม่ (ชม.) -> respawnMinutes
    const rawHrStr = (r[hrIdx] || '').trim();
    let respawnMinutes = 240; // 4 ชั่วโมง default
    const parsedHr = parseFloat(rawHrStr);
    if (!isNaN(parsedHr) && parsedHr > 0) {
      respawnMinutes = Math.round(parsedHr * 60);
    } else {
      const matchHrs = rawHrStr.match(/(\d+(\.\d+)?)\s*(hr|h|ชม|ชั่วโมง)/i);
      const matchMins = rawHrStr.match(/(\d+)\s*(min|m|นาที)/i);
      if (matchHrs) {
        respawnMinutes = Math.round(parseFloat(matchHrs[1]) * 60);
      } else if (matchMins) {
        respawnMinutes = parseInt(matchMins[1], 10);
      }
    }

    // 3. วันที่ตาย, ชมที่ตาย, นาทีที่ตาย
    const rawDateStr = (r[dateIdx] || '').trim();
    const rawHourStr = (r[hourIdx] || '').trim();
    const rawMinStr = (r[minIdx] || '').trim();

    // 4. เวลาเกิดใหม่ GMT+7
    const rawSpawnG = (r[spawnTimeIdx] || '').trim();

    // 5. วันที่เเละเวลาเกิดของบอส (เช่น 26/09/2026 19:31)
    const rawFullSpawnJ = (r[fullSpawnIdx] || '').trim();

    // 6. SV.
    const rawSV = (r[svIdx] || '').trim();
    let server: 'main' | 'sub' = fallbackServer;
    if (rawSV.includes('T3') || rawSV.toLowerCase().includes('main') || rawSV.includes('หลัก')) {
      server = 'main';
    } else if (rawSV.includes('S1') || rawSV.includes('Invasion') || rawSV.toLowerCase().includes('sub') || rawSV.includes('รอง')) {
      server = 'sub';
    }

    const serverTag = rawSV || (server === 'main' ? 'T3' : 'Invasion');

    // Parse Dates
    let lastKilledAt: string | null = null;
    let nextSpawnAt: string | null = null;

    const dateParts = parseDateParts(rawDateStr);
    const hourNum = parseInt(rawHourStr, 10);
    const minNum = parseInt(rawMinStr, 10);

    // กรณีมีข้อมูล วันที่ + ชม + นาที ครบถ้วน
    if (
      dateParts &&
      !isNaN(hourNum) &&
      !isNaN(minNum) &&
      hourNum >= 0 &&
      hourNum <= 23 &&
      minNum >= 0 &&
      minNum <= 59
    ) {
      const killIsoStr = `${dateParts.year}-${pad(dateParts.month)}-${pad(dateParts.day)}T${pad(hourNum)}:${pad(minNum)}:00+07:00`;
      const killDate = new Date(killIsoStr);
      if (!isNaN(killDate.getTime())) {
        lastKilledAt = killDate.toISOString();
        // เวลาเกิดใหม่ = เวลาตาย + รอบเกิด
        nextSpawnAt = new Date(killDate.getTime() + respawnMinutes * 60 * 1000).toISOString();
      }
    }

    // กรณีไม่มี C, D, E แต่มี วันที่เเละเวลาเกิด เช่น "26/09/2026 19:31"
    if (!nextSpawnAt && rawFullSpawnJ && !rawFullSpawnJ.includes('ไม่ทราบ')) {
      const [jDate, jTime] = rawFullSpawnJ.split(' ');
      const jDateParts = parseDateParts(jDate);
      if (jDateParts && jTime) {
        const [jHour, jMin] = jTime.split(':').map(v => parseInt(v, 10));
        if (!isNaN(jHour) && !isNaN(jMin)) {
          const spawnIso = `${jDateParts.year}-${pad(jDateParts.month)}-${pad(jDateParts.day)}T${pad(jHour)}:${pad(jMin)}:00+07:00`;
          const spDate = new Date(spawnIso);
          if (!isNaN(spDate.getTime())) {
            nextSpawnAt = spDate.toISOString();
            if (!lastKilledAt) {
              lastKilledAt = new Date(spDate.getTime() - respawnMinutes * 60 * 1000).toISOString();
            }
          }
        }
      }
    }

    // กรณีมีเวลาเกิดใหม่ เช่น "19:31"
    if (!nextSpawnAt && rawSpawnG && rawSpawnG.includes(':') && !rawSpawnG.includes('ไม่ทราบ')) {
      const [gHour, gMin] = rawSpawnG.split(':').map(v => parseInt(v, 10));
      const refDate = dateParts || {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
      };

      if (!isNaN(gHour) && !isNaN(gMin)) {
        const spawnIso = `${refDate.year}-${pad(refDate.month)}-${pad(refDate.day)}T${pad(gHour)}:${pad(gMin)}:00+07:00`;
        const spDate = new Date(spawnIso);
        if (!isNaN(spDate.getTime())) {
          nextSpawnAt = spDate.toISOString();
          if (!lastKilledAt) {
            lastKilledAt = new Date(spDate.getTime() - respawnMinutes * 60 * 1000).toISOString();
          }
        }
      }
    }

    // 1. Match with existing boss in current state first to preserve ID and prevent duplicate documents in Firestore!
    const existingBossMatch = existingBosses.find(
      eb => eb.server === server && areBossNamesMatching(eb.name, name)
    );

    // 2. Match with predefined boss metadata if exists
    const matchedKnownBoss = rawBossList.find(b => {
      const cleanBName = b.name.replace(/\s+/g, ' ').toLowerCase();
      const cleanTarget = name.toLowerCase();
      return cleanTarget.includes(cleanBName) || cleanBName.includes(cleanTarget) ||
        cleanTarget.split('-')[0].trim() === cleanBName.split('-')[0].trim();
    });

    // Use full canonical name if available (e.g. "เฟลิส - Felis" instead of just "เฟลิส")
    const canonicalName = existingBossMatch?.name || (matchedKnownBoss ? matchedKnownBoss.name : name);
    // CRITICAL: Preserve existing ID so Firestore updates the exact document instead of generating duplicate documents!
    const bossId = existingBossMatch?.id || `${server}-sheet-${name.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}`;

    const location = existingBossMatch?.location || matchedKnownBoss?.location || 'ตามแมพ / พื้นที่ล่า';
    const level = existingBossMatch?.level ?? matchedKnownBoss?.level;
    const dropItems = (existingBossMatch?.dropItems && existingBossMatch.dropItems.length > 0)
      ? existingBossMatch.dropItems
      : (matchedKnownBoss?.drops || []);
    const bossNumber = (isColBName && /^\d+$/.test(col0Trimmed)) 
      ? parseInt(col0Trimmed, 10) 
      : (existingBossMatch?.bossNumber ?? matchedKnownBoss?.num);
    const pinned = existingBossMatch?.pinned ?? matchedKnownBoss?.pinned ?? (index < 3);

    const bossObj: Boss = {
      id: bossId,
      name: canonicalName,
      server,
      serverTag,
      location,
      respawnMinutes,
      lastKilledAt,
      nextSpawnAt,
      notifiedStages: existingBossMatch?.notifiedStages || [],
      dropItems,
      pinned,
    };

    if (level !== undefined && level !== null) {
      bossObj.level = level;
    }
    if (bossNumber !== undefined && bossNumber !== null) {
      bossObj.bossNumber = bossNumber;
    }
    if (lastKilledAt) {
      bossObj.killedBy = 'Google Sheet';
    }

    bossesList.push(bossObj);
  });

  // Deduplicate before returning so no duplicate names are produced
  return deduplicateBossList(bossesList).uniqueBosses;
}

/**
 * Writes the reboot completion time to cell N2 in the user's Google Sheet
 */
export async function writeRebootTimeToGoogleSheet(
  sheetId: string, 
  rebootTimeStr: string, 
  targetServer: 'main' | 'sub' | 'all' = 'main'
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  const tabs: string[] = [];
  if (targetServer === 'main' || targetServer === 'all') tabs.push('Boss Time T3');
  if (targetServer === 'sub' || targetServer === 'all') tabs.push('BossTime_invasion');

  try {
    for (const tab of tabs) {
      const range = `'${tab}'!N2:N2`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
      await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range,
          majorDimension: 'ROWS',
          values: [[rebootTimeStr]],
        }),
      });
    }
    return true;
  } catch (err) {
    console.warn('writeRebootTimeToGoogleSheet error:', err);
    return false;
  }
}

/**
 * Sorts bosses to match the Google Sheet row structure (e.g., Felis on row 2, Valefar on row 3, etc.)
 */
export function sortBossesForSheet(bossList: Boss[]): Boss[] {
  return [...bossList].sort((a, b) => {
    const infoA = getBossColorInfo(a);
    const infoB = getBossColorInfo(b);
    const rowA = a.sheetRowIndex ?? infoA.sheetRow ?? 999;
    const rowB = b.sheetRowIndex ?? infoB.sheetRow ?? 999;
    if (rowA !== rowB) return rowA - rowB;
    return (a.bossNumber || 999) - (b.bossNumber || 999);
  });
}

/**
 * Returns formatted sheet rows along with background color for each row
 */
export function buildSheetRowsWithColors(
  bossList: Boss[],
  includeHeader: boolean = false
): { cells: (string | number)[]; color: string; spawnChance?: number }[] {
  const result: { cells: (string | number)[]; color: string; spawnChance?: number }[] = [];

  if (includeHeader) {
    result.push({
      cells: [
        '',
        'Name',
        'Hr.',
        'วันที่ตาย',
        'ชม',
        'นาที',
        'Update',
        'Respawn GMT+7',
        'Respawn GMT+8',
        'เรียงบอส',
        'วันที่เเละเวลาเกิดของบอส',
        'SV.',
      ],
      color: '#ffffff',
    });
  }

  const nowMs = Date.now();

  bossList.forEach((b, index) => {
    const colorInfo = getBossColorInfo(b);
    const bossNum = b.bossNumber !== undefined ? b.bossNumber : (index + 1);
    const respawnHours = (b.respawnMinutes / 60).toFixed(1).replace(/\.0$/, '');
    const serverLabel = b.serverTag || (b.server === 'main' ? 'T3' : 'Invasion');

    let deathDateStr = '';
    let deathHourStr = '';
    let deathMinStr = '';
    let respawnGmt7 = 'ไม่ทราบเวลา';
    let respawnGmt8 = 'ไม่ทราบเวลา';
    let fullSpawnStr = 'ไม่ทราบเวลา';
    let minutesLeftStr = '-';

    if (b.lastKilledAt) {
      const d = new Date(b.lastKilledAt);
      if (!isNaN(d.getTime())) {
        const parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).formatToParts(d);

        const getVal = (type: string) => parts.find(p => p.type === type)?.value || '';
        deathDateStr = `${getVal('day')}/${getVal('month')}/${getVal('year')}`;
        deathHourStr = parseInt(getVal('hour'), 10).toString();
        deathMinStr = parseInt(getVal('minute'), 10).toString();
      }
    }

    if (b.nextSpawnAt) {
      const sp = new Date(b.nextSpawnAt);
      if (!isNaN(sp.getTime())) {
        const diffMinutes = Math.round((sp.getTime() - nowMs) / 60000);
        minutesLeftStr = diffMinutes.toString();

        respawnGmt7 = sp.toLocaleTimeString('th-TH', {
          timeZone: 'Asia/Bangkok',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        respawnGmt8 = sp.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Singapore',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        const spParts = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).formatToParts(sp);

        const getSp = (type: string) => spParts.find(p => p.type === type)?.value || '';
        fullSpawnStr = `${getSp('day')}/${getSp('month')}/${getSp('year')} ${getSp('hour')}:${getSp('minute')}`;
      }
    }

    result.push({
      cells: [
        bossNum,
        b.name,
        respawnHours,
        deathDateStr,
        deathHourStr,
        deathMinStr,
        'FALSE',
        respawnGmt7,
        respawnGmt8,
        minutesLeftStr,
        fullSpawnStr,
        serverLabel,
      ],
      color: b.spawnColor || colorInfo.spawnColor || '#ffffff',
      spawnChance: b.spawnChance ?? colorInfo.spawnChance,
    });
  });

  return result;
}

/**
 * Build rich HTML Table with exact background colors for Google Sheets clipboard paste
 * When pasted into cell A2, Google Sheets colors the rows/cells accordingly!
 */
export function buildSheetHTMLTable(
  bossList: Boss[],
  includeHeader: boolean = false
): string {
  const sorted = sortBossesForSheet(bossList);
  const rows = buildSheetRowsWithColors(sorted, includeHeader);

  let html = '<meta charset="utf-8">';
  html += '<table style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt;">';

  for (const r of rows) {
    const bg = r.color || '#ffffff';
    html += `<tr style="background-color: ${bg}; height: 21px;">`;
    for (const cell of r.cells) {
      const val = cell !== undefined && cell !== null ? String(cell) : '';
      const escaped = val
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      html += `<td style="background-color: ${bg}; border: 1px solid #d9d9d9; padding: 2px 4px; mso-number-format:'\\@';">${escaped}</td>`;
    }
    html += '</tr>';
  }

  html += '</table>';
  return html;
}

/**
 * Export bosses data formatted for Google Sheets clipboard paste (Tab-separated values / TSV)
 * Can be pasted directly (Ctrl+V) into Google Sheets cell A1 or A2!
 */
export function exportBossesToClipboardText(
  bosses: Boss[], 
  server: 'main' | 'sub' | 'all' = 'all',
  includeHeader: boolean = false
): string {
  const filtered = server === 'all' ? bosses : bosses.filter((b) => b.server === server);
  const sorted = sortBossesForSheet(filtered);
  const rows = buildSheetRowsWithColors(sorted, includeHeader).map(r => r.cells);
  return rows
    .map(row => row.map(val => String(val ?? '').replace(/\t/g, ' ')).join('\t'))
    .join('\n');
}

/**
 * Copies bosses data to clipboard with full HTML formatting and colors for pasting at cell A2!
 */
export async function copyBossesForSheet(
  bosses: Boss[],
  server: 'main' | 'sub' | 'all' = 'all',
  includeHeader: boolean = false
): Promise<boolean> {
  const filtered = server === 'all' ? bosses : bosses.filter((b) => b.server === server);
  const sorted = sortBossesForSheet(filtered);
  const tsvText = exportBossesToClipboardText(sorted, 'all', includeHeader);
  const htmlTable = buildSheetHTMLTable(sorted, includeHeader);

  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      const item = new ClipboardItem({
        'text/html': new Blob([htmlTable], { type: 'text/html' }),
        'text/plain': new Blob([tsvText], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (err) {
    console.warn('ClipboardItem HTML copy failed, falling back to text:', err);
  }

  // Fallback to plain text TSV
  await navigator.clipboard.writeText(tsvText);
  return true;
}

/**
 * Export bosses data to CSV string with UTF-8 BOM matching the exact Google Sheet format
 */
export function exportBossesToCSV(bosses: Boss[], server: 'main' | 'sub' | 'all' = 'all'): string {
  const filtered = server === 'all' ? bosses : bosses.filter((b) => b.server === server);
  const sorted = sortBossesForSheet(filtered);
  const rows = buildSheetRows(sorted, true);
  const csvContent = rows
    .map(row =>
      row
        .map(cell => {
          const str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\r\n');

  // UTF-8 Byte Order Mark for Thai characters in Excel and Google Sheets
  return '\uFEFF' + csvContent;
}

export function triggerCSVDownload(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

