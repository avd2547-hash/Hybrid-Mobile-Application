import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalEvent } from '../data/events';

// กำหนด Notification Handler ให้แจ้งเตือนแม้เปิดแอปอยู่ (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDERS_KEY = '@event_reminders_map';
export const CHANNEL_ID = 'travel-event-reminders';

// สร้าง Android Notification Channel
export async function setupNotificationChannelAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'การแจ้งเตือนกิจกรรมท่องเที่ยว',
      description: 'แจ้งเตือนก่อนถึงเวลากิจกรรมและทริปสำคัญในจังหวัดอุดรธานี',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#B75B3E',
      sound: 'default',
    });
  }
}

// ขอ Permission เมื่อผู้ใช้กดตั้งเตือน (Just-In-Time Permission)
export async function requestNotificationPermissionsAsync(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

// ดึง Map ของ Reminder IDs (eventId -> notificationId)
export async function getStoredRemindersAsync(): Promise<Record<string, string>> {
  try {
    const stored = await AsyncStorage.getItem(REMINDERS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// ตั้งเตือนกิจกรรม
export async function scheduleEventReminderAsync(
  event: LocalEvent,
  triggerSeconds: number = 5 // ค่าเริ่มต้นสำหรับการทดสอบ Lab (หรือ 1800 สำหรับ 30 นาที)
): Promise<string | null> {
  const hasPermission = await requestNotificationPermissionsAsync();
  if (!hasPermission) {
    return null;
  }

  await setupNotificationChannelAsync();

  // Notification Payload: เก็บเฉพาะ eventId (ไม่เก็บข้อมูลส่วนตัวหรือ Sensitive data ตามเกณฑ์ DoD)
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `⏰ แจ้งเตือนกิจกรรม: ${event.title}`,
      body: `กิจกรรมที่ "${event.placeName}" กำลังจะเริ่มขึ้นในไม่ช้า แตะเพื่อดูรายละเอียด`,
      data: {
        eventId: event.id, // Safe payload: only ID
      },
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      badge: 1,
    },
    trigger: {
      seconds: triggerSeconds,
      channelId: CHANNEL_ID,
    } as any,
  });

  // บันทึกลง AsyncStorage
  const current = await getStoredRemindersAsync();
  current[event.id] = notificationId;
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(current));

  return notificationId;
}

// ยกเลิกการตั้งเตือนกิจกรรม
export async function cancelEventReminderAsync(eventId: string): Promise<boolean> {
  const current = await getStoredRemindersAsync();
  const notificationId = current[eventId];

  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (e) {
      console.warn('Could not cancel notification:', e);
    }
    delete current[eventId];
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(current));
    return true;
  }

  return false;
}
