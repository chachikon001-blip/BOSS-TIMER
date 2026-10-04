import { Boss } from '../types/boss';

/**
 * Normalizes a boss name for comparison by removing spaces, symbols, and casing.
 */
export function normalizeNameForComparison(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/[\s\-_/()（）.,:;+[\]]+/g, '')
    .trim();
}

/**
 * Tests if two boss names refer to the same boss.
 * Handles patterns like "เฟลิส - Felis" vs "เฟลิส" vs "Felis"
 * and "ดราก้อนบีสต์ - DB" vs "ดราก้อนบีสต์".
 */
export function areBossNamesMatching(nameA: string, nameB: string): boolean {
  if (!nameA || !nameB) return false;
  const cleanA = normalizeNameForComparison(nameA);
  const cleanB = normalizeNameForComparison(nameB);
  if (cleanA === cleanB) return true;

  // Split by hyphen or slash (e.g. "เฟลิส - Felis" -> ["เฟลิส", "Felis"])
  const partsA = nameA
    .split(/[-/]/)
    .map(p => normalizeNameForComparison(p))
    .filter(p => p.length >= 2);
  const partsB = nameB
    .split(/[-/]/)
    .map(p => normalizeNameForComparison(p))
    .filter(p => p.length >= 2);

  for (const pA of partsA) {
    if (cleanB === pA) return true;
    for (const pB of partsB) {
      if (pA === pB) return true;
    }
  }

  for (const pB of partsB) {
    if (cleanA === pB) return true;
  }

  // Exact startsWith check if length is significant (e.g. "เชอร์ทูบา" in "เชอร์ทูบา-chertuba")
  if (cleanA.length >= 4 && cleanB.startsWith(cleanA)) return true;
  if (cleanB.length >= 4 && cleanA.startsWith(cleanB)) return true;

  return false;
}

/**
 * Deduplicates a list of Bosses per server.
 * Returns the unique list of bosses and any extra duplicate records found.
 */
export function deduplicateBossList(bossList: Boss[]): {
  uniqueBosses: Boss[];
  duplicatesToRemove: Boss[];
} {
  const uniqueBosses: Boss[] = [];
  const duplicatesToRemove: Boss[] = [];

  for (const b of bossList) {
    if (!b || !b.name) continue;

    // Look for an existing boss on the same server with matching identity
    const existingIdx = uniqueBosses.findIndex(
      existing =>
        existing.server === b.server &&
        (existing.id === b.id || areBossNamesMatching(existing.name, b.name))
    );

    if (existingIdx === -1) {
      uniqueBosses.push({ ...b });
    } else {
      const existing = uniqueBosses[existingIdx];
      const bHasSpawn = !!(b.nextSpawnAt && !isNaN(new Date(b.nextSpawnAt).getTime()));
      const existingHasSpawn = !!(existing.nextSpawnAt && !isNaN(new Date(existing.nextSpawnAt).getTime()));

      // Prioritize the entry with active spawn/kill time
      if (bHasSpawn && !existingHasSpawn) {
        duplicatesToRemove.push(existing);
        uniqueBosses[existingIdx] = {
          ...b,
          // Preserve established ID if existing had a canonical id
          id: existing.id || b.id,
          name: existing.name.length > b.name.length ? existing.name : b.name,
          pinned: existing.pinned ?? b.pinned,
          notes: existing.notes || b.notes,
          bossNumber: existing.bossNumber ?? b.bossNumber,
        };
      } else {
        duplicatesToRemove.push(b);
        uniqueBosses[existingIdx] = {
          ...existing,
          serverTag: existing.serverTag || b.serverTag,
          location:
            existing.location === 'ตามแมพ / พื้นที่ล่า' && b.location !== 'ตามแมพ / พื้นที่ล่า'
              ? b.location
              : existing.location,
          dropItems:
            existing.dropItems && existing.dropItems.length > 0 ? existing.dropItems : b.dropItems,
          level: existing.level || b.level,
          bossNumber: existing.bossNumber ?? b.bossNumber,
          // Keep newest name if more descriptive
          name: existing.name.includes('-') ? existing.name : (b.name.includes('-') ? b.name : existing.name),
        };
      }
    }
  }

  return { uniqueBosses, duplicatesToRemove };
}
