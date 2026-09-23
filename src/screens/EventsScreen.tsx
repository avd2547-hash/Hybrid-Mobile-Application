import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LocalEvent, UDON_EVENTS } from '../data/events';
import EventDetailModal from '../components/EventDetailModal';
import {
  cancelEventReminderAsync,
  getStoredRemindersAsync,
  scheduleEventReminderAsync,
} from '../services/NotificationService';

interface EventsScreenProps {
  onOpenMapPlace?: (placeName: string) => void;
  externalSelectedEventId?: string | null;
  onClearExternalSelectedEvent?: () => void;
}

export default function EventsScreen({
  onOpenMapPlace,
  externalSelectedEventId,
  onClearExternalSelectedEvent,
}: EventsScreenProps) {
  const [reminders, setReminders] = useState<Record<string, string>>({});
  const [selectedEvent, setSelectedEvent] = useState<LocalEvent | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // โหลดรายการ Reminders ที่เคยตั้งไว้
  const loadReminders = async () => {
    const stored = await getStoredRemindersAsync();
    setReminders(stored);
  };

  useEffect(() => {
    loadReminders();
  }, []);

  // รองรับ Deep Link จาก Notification แตะเข้ามา
  useEffect(() => {
    if (externalSelectedEventId) {
      const found = UDON_EVENTS.find((e) => e.id === externalSelectedEventId);
      // หากพบหรือไม่พบ (Invalid ID) ก็เปิด Modal เพื่อโชว์ตามโจทย์ DoD
      setSelectedEvent(found || null);
      setIsModalVisible(true);
      onClearExternalSelectedEvent?.();
    }
  }, [externalSelectedEventId, onClearExternalSelectedEvent]);

  // ตั้งหรือยกเลิกการแจ้งเตือน
  const handleToggleReminder = async (event: LocalEvent, quickTestSeconds?: number) => {
    const isReminded = !!reminders[event.id];

    if (isReminded) {
      // ยกเลิก
      await cancelEventReminderAsync(event.id);
      await loadReminders();
      Alert.alert('ยกเลิกแล้ว', `ยกเลิกการเตือน "${event.title}" เรียบร้อยแล้ว`);
    } else {
      // ตั้งเตือน (ถ้าเลือก Quick Test จะเตือนใน 5 วิ เพื่อทดสอบ Lab 11 สะดวก, ถ้าปกติคือ 30 นาทีก่อนเริ่ม)
      const seconds = quickTestSeconds !== undefined ? quickTestSeconds : 5;
      const notifId = await scheduleEventReminderAsync(event, seconds);

      if (notifId) {
        await loadReminders();
        Alert.alert(
          'ตั้งเตือนสำเร็จ 🔔',
          seconds === 5
            ? `การแจ้งเตือนจำลองจะปรากฏขึ้นใน 5 วินาที (สามารถพับแอปเพื่อทดสอบ Background ได้)`
            : `ระบบจะแจ้งเตือนล่วงหน้า 30 นาทีก่อนเริ่มกิจกรรม`
        );
      } else {
        Alert.alert(
          'ไม่สามารถตั้งเตือนได้',
          'กรุณาอนุญาตสิทธิ์การแจ้งเตือนในการตั้งค่าโทรศัพท์'
        );
      }
    }
  };

  // ทดสอบจำลอง Invalid Deep Link ตามโจทย์ DoD
  const handleTestInvalidDeepLink = () => {
    setSelectedEvent(null);
    setIsModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>🔔 กิจกรรม & แจ้งเตือน (Lab 11)</Text>
          <Pressable onPress={handleTestInvalidDeepLink} style={styles.testBtn}>
            <Text style={styles.testBtnText}>ทดสอบ Invalid ID</Text>
          </Pressable>
        </View>
        <Text style={styles.headerSubtitle}>
          ตั้งเวลาแจ้งเตือนกิจกรรมล่วงหน้า แตะที่การแจ้งเตือนเพื่อเปิดดูรายละเอียด
        </Text>
      </View>

      {/* Events List */}
      <FlatList
        data={UDON_EVENTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isReminded = !!reminders[item.id];

          return (
            <Pressable
              onPress={() => {
                setSelectedEvent(item);
                setIsModalVisible(true);
              }}
              style={({ pressed }) => [
                styles.eventCard,
                isReminded && styles.eventCardReminded,
                pressed && styles.eventCardPressed,
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                {isReminded && (
                  <View style={styles.activeReminderBadge}>
                    <MaterialCommunityIcons name="bell-check" size={14} color="#FFF" />
                    <Text style={styles.activeReminderText}>เปิดเตือนแล้ว</Text>
                  </View>
                )}
              </View>

              <Text style={styles.eventTitle}>{item.title}</Text>

              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color="#B75B3E" />
                <Text style={styles.metaText}>{item.placeName}</Text>
              </View>

              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="clock-time-four-outline" size={16} color="#7B6F65" />
                <Text style={styles.metaText}>{item.timeString}</Text>
              </View>

              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => handleToggleReminder(item, 5)}
                  style={[
                    styles.actionBtn,
                    isReminded ? styles.actionBtnCancel : styles.actionBtnQuick,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isReminded ? 'bell-off-outline' : 'bell-ring'}
                    size={16}
                    color={isReminded ? '#C62828' : '#FFF'}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      isReminded ? styles.actionBtnTextCancel : styles.actionBtnTextQuick,
                    ]}
                  >
                    {isReminded ? 'ยกเลิกเตือน' : 'ทดสอบเตือน (5 วิ)'}
                  </Text>
                </Pressable>

                {!isReminded && (
                  <Pressable
                    onPress={() => handleToggleReminder(item, 1800)}
                    style={styles.actionBtnNormal}
                  >
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#B75B3E" />
                    <Text style={styles.actionBtnTextNormal}>เตือนก่อน 30 น.</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          );
        }}
      />

      {/* Event Detail Modal (Deep Link Target) */}
      <EventDetailModal
        event={selectedEvent}
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedEvent(null);
        }}
        isReminded={selectedEvent ? !!reminders[selectedEvent.id] : false}
        onToggleReminder={(ev) => handleToggleReminder(ev, 5)}
        onOpenLocation={onOpenMapPlace}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F1E7',
  },
  header: {
    backgroundColor: '#FFFCF7',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D9C9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2F2924',
  },
  testBtn: {
    backgroundColor: '#F3E2D2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  testBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8F3F2A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#7B6F65',
    marginTop: 4,
    lineHeight: 16,
  },
  listContent: {
    padding: 14,
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#FFFCF7',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8D9C9',
  },
  eventCardReminded: {
    borderColor: '#2E7D32',
    backgroundColor: '#F6FBF6',
  },
  eventCardPressed: {
    opacity: 0.9,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#F3E2D2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8F3F2A',
  },
  activeReminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  activeReminderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2F2924',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#5A5048',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3E2D2',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnQuick: {
    backgroundColor: '#B75B3E',
  },
  actionBtnCancel: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnTextQuick: {
    color: '#FFF',
  },
  actionBtnTextCancel: {
    color: '#C62828',
  },
  actionBtnNormal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#B75B3E',
  },
  actionBtnTextNormal: {
    color: '#B75B3E',
    fontSize: 12,
    fontWeight: '700',
  },
});
