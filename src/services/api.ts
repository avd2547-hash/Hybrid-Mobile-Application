import { CampusEvent } from '../types/event';
import { MOCK_EVENTS } from '../data/mockEvents';
import {
  loadRegistrations,
  loadUserEvents,
  saveRegistrations,
  saveUserEvents,
} from './storage';

// NOTE: ใน Lab จริงให้เปลี่ยน API_URL เป็น endpoint จริงใน .env
// const API_URL = process.env.EXPO_PUBLIC_API_URL;
// สัปดาห์นี้ใช้ mock data เพื่อให้แอปรันได้โดยไม่ต้องมี backend

// ─── Type Guards (Week 6) ─────────────────────────────────────────────────

function isCampusEvent(value: unknown): value is CampusEvent {
  if (typeof value !== 'object' || value === null) return false;
  const event = value as Record<string, unknown>;
  const location = event.location;
  if (typeof location !== 'object' || location === null) return false;
  const loc = location as Record<string, unknown>;
  return (
    typeof event.id === 'string' &&
    typeof event.title === 'string' &&
    typeof event.description === 'string' &&
    typeof event.startsAt === 'string' &&
    (event.imageUrl === undefined || typeof event.imageUrl === 'string') &&
    typeof loc.name === 'string' &&
    typeof loc.latitude === 'number' &&
    Number.isFinite(loc.latitude) &&
    typeof loc.longitude === 'number' &&
    Number.isFinite(loc.longitude)
  );
}

function parseEvents(payload: unknown): CampusEvent[] {
  if (!Array.isArray(payload) || !payload.every(isCampusEvent)) {
    throw new Error('รูปแบบข้อมูลกิจกรรมจาก API ไม่ถูกต้อง');
  }
  return payload;
}

// ─── API Functions (Week 6) ───────────────────────────────────────────────

/** รวมกิจกรรมที่ผู้ใช้สร้างเอง + mock events (กิจกรรมที่สร้างมาก่อนมาก่อนในลิสต์) */
async function getAllEvents(account: string, signal?: AbortSignal): Promise<CampusEvent[]> {
  const userEvents = await loadUserEvents(account);
  return parseEvents([...userEvents, ...MOCK_EVENTS]);
}

/** ดึงรายการกิจกรรมทั้งหมด — account เป็นชื่อบัญชีที่ล็อกอิน (แยกกิจกรรมที่สร้างเองตามบัญชี) */
export async function getEvents(
  account: string,
  signal?: AbortSignal,
): Promise<CampusEvent[]> {
  // Simulate network delay (150ms)
  await new Promise((resolve) => setTimeout(resolve, 150));
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  return getAllEvents(account, signal);
}

/** ดึงรายละเอียดกิจกรรมตาม ID */
export async function getEventById(
  account: string,
  id: string,
  signal?: AbortSignal,
): Promise<CampusEvent | null> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const all = await getAllEvents(account, signal);
  return all.find((e) => e.id === id) ?? null;
}

/** สร้างกิจกรรมใหม่ — บันทึกลง storage แล้วจะปรากฏในหน้ารายการทันที */
export async function createEvent(
  account: string,
  payload: {
    title: string;
    description: string;
    locationName: string;
    category: CampusEvent['category'];
    capacity: number;
    startsAt: string; // ISO 8601 — วันเวลาที่ผู้ใช้เลือกจาก picker ในฟอร์ม
    imageUrl?: string;
    coords?: { latitude: number; longitude: number }; // จากลิงก์ Google Maps (ถ้ามี)
  },
  signal?: AbortSignal,
): Promise<CampusEvent> {
  await new Promise((resolve) => setTimeout(resolve, 600)); // simulate network
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const newEvent: CampusEvent = {
    id: `user-${Date.now()}`,
    title: payload.title.trim(),
    description: payload.description.trim(),
    startsAt: payload.startsAt, // วันเวลาจริงจากฟอร์ม — ใช้คำนวณเวลาแจ้งเตือนล่วงหน้า
    category: payload.category,
    capacity: payload.capacity,
    registeredCount: 0,
    imageUrl: payload.imageUrl,
    location: {
      name: payload.locationName.trim(),
      // ใช้พิกัดจากลิงก์ Google Maps ถ้ามี ไม่งั้นใช้กลาง มข.
      latitude: payload.coords?.latitude ?? 16.4742,
      longitude: payload.coords?.longitude ?? 102.8231,
    },
  };

  const userEvents = await loadUserEvents(account);
  await saveUserEvents(account, [newEvent, ...userEvents]);
  console.log('[API] Event created:', newEvent.id);
  return newEvent;
}

/** ลงทะเบียนเข้าร่วมกิจกรรม — บันทึกการเข้าร่วมต่อบัญชี เพื่อให้ยกเลิก/ตรวจสถานะได้ภายหลัง */
export async function registerForEvent(
  account: string,
  eventId: string,
  payload: { fullName: string; email: string; studentId: string },
  signal?: AbortSignal,
): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const joined = await loadRegistrations(account);
  if (!joined.includes(eventId)) {
    await saveRegistrations(account, [eventId, ...joined]);
  }
  console.log('[API] Registration:', account, eventId, payload);
  return { success: true };
}

/** id กิจกรรมทั้งหมดที่บัญชีนี้ลงทะเบียนไว้ */
export async function getJoinedEventIds(
  account: string,
  signal?: AbortSignal,
): Promise<string[]> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  return loadRegistrations(account);
}

/** ยกเลิกการเข้าร่วมกิจกรรม (ลบออกจากรายการที่ลงทะเบียนไว้ของบัญชีนี้) */
export async function cancelRegistration(
  account: string,
  eventId: string,
  signal?: AbortSignal,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const joined = await loadRegistrations(account);
  await saveRegistrations(
    account,
    joined.filter((id) => id !== eventId),
  );
}

/**
 * ลบกิจกรรมที่บัญชีนี้สร้างเองเท่านั้น — ถ้าไม่พบในรายการ user-events ของบัญชี
 * จะ throw Error('event-not-found') (ป้องกันลบกิจกรรมของคนอื่น/mock)
 */
export async function deleteEvent(
  account: string,
  eventId: string,
  signal?: AbortSignal,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300)); // simulate network
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const userEvents = await loadUserEvents(account);
  const next = userEvents.filter((e) => e.id !== eventId);
  if (next.length === userEvents.length) {
    throw new Error('event-not-found');
  }
  await saveUserEvents(account, next);

  // ถ้าเคยลงทะเบียนกิจกรรมนี้ไว้ ลบออกจากรายการเข้าร่วมด้วยเพื่อความสม่ำเสมอ
  const joined = await loadRegistrations(account);
  if (joined.includes(eventId)) {
    await saveRegistrations(
      account,
      joined.filter((id) => id !== eventId),
    );
  }
  console.log('[API] Event deleted:', account, eventId);
}
