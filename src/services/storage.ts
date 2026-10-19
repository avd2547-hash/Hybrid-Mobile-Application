import AsyncStorage from '@react-native-async-storage/async-storage';
import { CampusEvent } from '../types/event';

// ข้อมูลต่อบัญชี (favorites, user-events) ใช้ key แยกตามชื่อบัญชี
// เพื่อให้ "บัญชีของใครของมัน" — สมัครหลายบัญชีก็เห็นข้อมูลแยกกัน
const ACCOUNT_DATA_PREFIX = 'campus-events/account';
const EVENTS_CACHE_KEY = 'campus-events/events-cache/v1'; // cache รวม (ไม่ต้องแยกบัญชี)
const CACHE_UPDATED_AT_KEY = 'campus-events/events-cache-updated-at/v1';
const LEGACY_FAVORITES_KEY = 'campus-events/favorite-ids/v1'; // ข้อมูลเก่าก่อนแยกบัญชี
const LEGACY_USER_EVENTS_KEY = 'campus-events/user-events/v1';

/** key ข้อมูลต่อบัญชี — accountKey เป็นชื่อบัญชีจริง (คงที่) */
function accountKey(suffix: string, account: string): string {
  // บัญชีอาจมีตัวอักษรไทย/วรรณยุกต์ — encodeURIComponent กัน key พัง
  return `${ACCOUNT_DATA_PREFIX}/${encodeURIComponent(account)}/${suffix}`;
}

// ─── Favorites (ต่อบัญชี) ───────────────────────────────────────────────────

/**
 * โหลดรายการโปรดของบัญชี
 * ครั้งแรกที่เรียก (ยังไม่มีข้อมูลต่อบัญชี) จะ migrate จาก key เก่า (global) ให้อัตโนมัติ
 */
export async function loadFavoriteIds(account: string): Promise<string[]> {
  try {
    const key = accountKey('favorites', account);
    const raw = await AsyncStorage.getItem(key);
    if (raw !== null) {
      return parseFavoriteIds(raw);
    }
    // ยังไม่มีข้อมูลต่อบัญชี — migrate จาก key เก่า (ถ้ามี) แล้วลบ key เก่า
    const legacyRaw = await AsyncStorage.getItem(LEGACY_FAVORITES_KEY);
    const ids = legacyRaw !== null ? parseFavoriteIds(legacyRaw) : [];
    await AsyncStorage.setItem(key, JSON.stringify(ids));
    await AsyncStorage.removeItem(LEGACY_FAVORITES_KEY);
    return ids;
  } catch {
    return [];
  }
}

function parseFavoriteIds(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) && value.every((id) => typeof id === 'string')
      ? value
      : [];
  } catch {
    return [];
  }
}

export async function saveFavoriteIds(
  account: string,
  ids: string[],
): Promise<void> {
  await AsyncStorage.setItem(accountKey('favorites', account), JSON.stringify(ids));
}

// ─── Event Cache (รวม — ใช้ร่วมกันทุกบัญชี) ────────────────────────────────

export async function loadCachedEvents(): Promise<{
  events: CampusEvent[];
  updatedAt: string | null;
}> {
  try {
    const [raw, updatedAt] = await Promise.all([
      AsyncStorage.getItem(EVENTS_CACHE_KEY),
      AsyncStorage.getItem(CACHE_UPDATED_AT_KEY),
    ]);
    if (!raw) return { events: [], updatedAt: null };
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return { events: [], updatedAt: null };
    return { events: value as CampusEvent[], updatedAt };
  } catch {
    return { events: [], updatedAt: null };
  }
}

export async function saveCachedEvents(events: CampusEvent[]): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events)),
    AsyncStorage.setItem(CACHE_UPDATED_AT_KEY, new Date().toISOString()),
  ]);
}

export async function clearCache(): Promise<void> {
  await AsyncStorage.multiRemove([EVENTS_CACHE_KEY, CACHE_UPDATED_AT_KEY]);
}

// ─── User-created Events (ต่อบัญชี) ─────────────────────────────────────────

/** โหลดกิจกรรมที่บัญชีนี้สร้างเอง (migrate จาก key เก่าครั้งแรกเหมือน favorites) */
export async function loadUserEvents(account: string): Promise<CampusEvent[]> {
  try {
    const key = accountKey('user-events', account);
    const raw = await AsyncStorage.getItem(key);
    if (raw !== null) {
      return parseUserEvents(raw);
    }
    // migrate จาก key เก่า (ถ้ามี) แล้วลบ key เก่า — ให้บัญชีที่ล็อกอินอยู่รับของเดิมไปก่อน
    const legacyRaw = await AsyncStorage.getItem(LEGACY_USER_EVENTS_KEY);
    const events = legacyRaw !== null ? parseUserEvents(legacyRaw) : [];
    await AsyncStorage.setItem(key, JSON.stringify(events));
    await AsyncStorage.removeItem(LEGACY_USER_EVENTS_KEY);
    return events;
  } catch {
    return [];
  }
}

function parseUserEvents(raw: string): CampusEvent[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? (value as CampusEvent[]) : [];
  } catch {
    return [];
  }
}

export async function saveUserEvents(
  account: string,
  events: CampusEvent[],
): Promise<void> {
  await AsyncStorage.setItem(accountKey('user-events', account), JSON.stringify(events));
}

// ─── Joined / Registered Events (ต่อบัญชี) ───────────────────────────────

/** โหลดรายการ id กิจกรรมที่บัญชีนี้ลงทะเบียนไว้ */
export async function loadRegistrations(account: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(accountKey('registrations', account));
    if (raw === null) return [];
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) && value.every((id) => typeof id === 'string')
      ? value
      : [];
  } catch {
    return [];
  }
}

export async function saveRegistrations(
  account: string,
  ids: string[],
): Promise<void> {
  await AsyncStorage.setItem(accountKey('registrations', account), JSON.stringify(ids));
}
