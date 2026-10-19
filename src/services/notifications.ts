import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { CampusEvent } from '../types/event';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHANNEL_ID = 'event-reminders';
const REMINDERS_KEY = 'campus-events/reminders/v1';

// ─── ตัวเลือกเวลาแจ้งเตือนล่วงหน้า ───────────────────────────────────────────

export type ReminderOption = { label: string; seconds: number };

export const REMINDER_OPTIONS: ReminderOption[] = [
  { label: 'ทันที', seconds: 0 },
  { label: '5 วินาที', seconds: 5 },
  { label: '30 วินาที', seconds: 30 },
  { label: '5 นาที', seconds: 5 * 60 },
  { label: '30 นาที', seconds: 30 * 60 },
];

export function formatLeadTime(seconds: number): string {
  if (seconds < 60) return `${seconds} วินาที`;
  return `${seconds / 60} นาที`;
}

// ─── Handler (ตั้งใน Root Layout — Week 11) ─────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Web fallback ───────────────────────────────────────────────────────
// expo-notifications บนเว็บรองรับเฉพาะการแจ้งเตือน "ทันที" (Notification API)
// ไม่รองรับ scheduled trigger (DATE/TIME_INTERVAL) — ต้องใช้ Notification ของเบราว์เซอร์เอง
// และการตั้งเวลาล่วงหน้าใช้ setTimeout (ทำงานเฉพาะเมื่อเปิดแท็บค้างไว้)

function isWeb(): boolean {
  return Platform.OS === 'web';
}

/** ขอสิทธิ์แจ้งเตือนของเบราว์เซอร์ (web เท่านั้น) */
async function requestWebPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function showWebNotification(title: string, body: string): void {
  new Notification(title, { body, icon: '/favicon.ico' });
}

// ─── Channel & Permission ─────────────────────────────────────────────────

export async function ensureNotificationPermission(): Promise<boolean> {
  if (isWeb()) return requestWebPermission();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'การเตือนกิจกรรม',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// ─── Schedule / Cancel ───────────────────────────────────────────────────

/** ตั้งการแจ้งเตือนล่วงหน้าตาม leadSeconds ที่เลือก (0 = แจ้งทันที) คืนค่า identifier */
export async function scheduleEventReminder(
  event: CampusEvent,
  leadSeconds: number,
): Promise<string> {
  const granted = await ensureNotificationPermission();
  if (!granted) throw new Error('notification-permission-denied');

  // ── Web: ใช้ Notification API ของเบราว์เซอร์ ──
  if (isWeb()) {
    if (leadSeconds === 0) {
      const title = `🔔 ${event.title}`;
      showWebNotification(title, `กำลังจะเริ่มแล้ว! สถานที่: ${event.location.name}`);
      const stored = await getStoredReminders();
      stored[event.id] = { notificationId: 'web-immediate', leadSeconds: 0 };
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(stored));
      return 'web-immediate';
    }
    const triggerDate = new Date(new Date(event.startsAt).getTime() - leadSeconds * 1000);
    if (triggerDate <= new Date()) throw new Error('reminder-time-has-passed');
    const delayMs = triggerDate.getTime() - Date.now();
    // setTimeout จำกัดได้ ~24.8 วัน (2^31-1 ms) เกินกว่านั้นเบราว์เซอร์ไม่รองรับ
    if (delayMs > 2147483647) throw new Error('web-reminder-too-far');
    const leadLabel = formatLeadTime(leadSeconds);
    // หมายเหตุ: เบราว์เซอร์จะแจ้งเตือนได้เฉพาะเมื่อแท็บนี้ยังเปิดอยู่
    const timerId = setTimeout(() => {
      showWebNotification(
        `ใกล้ถึงเวลา: ${event.title}`,
        `เริ่มในอีก ${leadLabel}ที่ ${event.location.name}`,
      );
    }, delayMs);
    const stored = await getStoredReminders();
    stored[event.id] = { notificationId: `web-timer-${String(timerId)}`, leadSeconds };
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(stored));
    return stored[event.id].notificationId;
  }

  // ── Native (iOS/Android) ──
  // แจ้งทันที (ไม่ผูกกับวันที่กิจกรรม)
  if (leadSeconds === 0) {
    const immediateId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 ${event.title}`,
        body: `กำลังจะเริ่มแล้ว! สถานที่: ${event.location.name}`,
        data: { eventId: event.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        channelId: CHANNEL_ID,
      },
    });
    const stored = await getStoredReminders();
    stored[event.id] = { notificationId: immediateId, leadSeconds: 0 };
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(stored));
    return immediateId;
  }

  const triggerDate = new Date(new Date(event.startsAt).getTime() - leadSeconds * 1000);
  if (triggerDate <= new Date()) throw new Error('reminder-time-has-passed');

  const leadLabel = formatLeadTime(leadSeconds);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `ใกล้ถึงเวลา: ${event.title}`,
      body: `เริ่มในอีก ${leadLabel}ที่ ${event.location.name}`,
      data: { eventId: event.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: CHANNEL_ID,
    },
  });

  // บันทึก identifier + lead time ไว้ใน AsyncStorage
  const stored = await getStoredReminders();
  stored[event.id] = { notificationId: id, leadSeconds };
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(stored));
  return id;
}

export type StoredReminder = { notificationId: string; leadSeconds: number };

export async function cancelEventReminder(eventId: string): Promise<void> {
  const stored = await getStoredReminders();
  const reminder = stored[eventId];
  if (reminder) {
    if (reminder.notificationId.startsWith('web-timer-')) {
      // Web: ยกเลิก setTimeout ที่ตั้งไว้
      const timerId = Number(reminder.notificationId.slice('web-timer-'.length));
      if (!isNaN(timerId)) clearTimeout(timerId);
    } else {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
    }
  }
  delete stored[eventId];
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(stored));
}

export async function getStoredReminders(): Promise<Record<string, StoredReminder>> {
  try {
    const raw = await AsyncStorage.getItem(REMINDERS_KEY);
    if (!raw) return {};
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return {};
    const result: Record<string, StoredReminder> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (
        typeof val === 'object' &&
        val !== null &&
        typeof (val as Record<string, unknown>).notificationId === 'string' &&
        typeof (val as Record<string, unknown>).leadSeconds === 'number'
      ) {
        result[key] = val as StoredReminder;
      }
    }
    return result;
  } catch {
    return {};
  }
}
