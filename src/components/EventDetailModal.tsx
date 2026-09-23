import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LocalEvent } from '../data/events';

interface EventDetailModalProps {
  event: LocalEvent | null;
  visible: boolean;
  onClose: () => void;
  isReminded: boolean;
  onToggleReminder: (event: LocalEvent) => void;
  onOpenLocation?: (placeName: string) => void;
}

export default function EventDetailModal({
  event,
  visible,
  onClose,
  isReminded,
  onToggleReminder,
  onOpenLocation,
}: EventDetailModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{event?.category || 'กิจกรรม'}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#7B6F65" />
            </Pressable>
          </View>

          {/* Fallback if event not found (Invalid ID test) */}
          {!event ? (
            <View style={styles.fallbackContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#B75B3E" />
              <Text style={styles.fallbackTitle}>ไม่พบข้อมูลกิจกรรม</Text>
              <Text style={styles.fallbackMessage}>
                รหัสกิจกรรมนี้ไม่มีอยู่ในระบบหรืออาจสิ้นสุดลงแล้ว (Invalid Event ID Fallback)
              </Text>
              <Pressable onPress={onClose} style={styles.fallbackButton}>
                <Text style={styles.fallbackButtonText}>กลับไปหน้ารายการ</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
              <Text style={styles.title}>{event.title}</Text>

              {/* Place & Time */}
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="map-marker" size={18} color="#B75B3E" />
                <Text style={styles.infoText}>{event.placeName}</Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="clock-outline" size={18} color="#B75B3E" />
                <Text style={styles.infoText}>{event.timeString}</Text>
              </View>

              {/* Highlight */}
              <View style={styles.highlightCard}>
                <MaterialCommunityIcons name="star-outline" size={20} color="#8F3F2A" />
                <Text style={styles.highlightText}>{event.highlight}</Text>
              </View>

              {/* Description */}
              <Text style={styles.sectionHeader}>รายละเอียดกิจกรรม</Text>
              <Text style={styles.description}>{event.description}</Text>

              {/* Actions */}
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => onToggleReminder(event)}
                  style={[
                    styles.reminderButton,
                    isReminded ? styles.reminderButtonActive : styles.reminderButtonInactive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isReminded ? 'bell-check' : 'bell-ring-outline'}
                    size={20}
                    color={isReminded ? '#FFF' : '#B75B3E'}
                  />
                  <Text
                    style={[
                      styles.reminderButtonText,
                      isReminded ? styles.reminderButtonTextActive : styles.reminderButtonTextInactive,
                    ]}
                  >
                    {isReminded ? 'ยกเลิกการแจ้งเตือน' : 'ตั้งเตือนกิจกรรมนี้'}
                  </Text>
                </Pressable>

                {onOpenLocation && (
                  <Pressable
                    onPress={() => {
                      onClose();
                      onOpenLocation(event.placeName);
                    }}
                    style={styles.mapButton}
                  >
                    <MaterialCommunityIcons name="map" size={18} color="#2F2924" />
                    <Text style={styles.mapButtonText}>ดูบนแผนที่</Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFCF7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#F3E2D2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeText: {
    color: '#8F3F2A',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2F2924',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4A403A',
    fontWeight: '600',
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F4',
    borderWidth: 1,
    borderColor: '#E8D9C9',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginVertical: 12,
  },
  highlightText: {
    fontSize: 13,
    color: '#8F3F2A',
    fontWeight: '700',
    flex: 1,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7B6F65',
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4A403A',
    marginBottom: 20,
  },
  actionRow: {
    gap: 10,
    paddingBottom: 16,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  reminderButtonActive: {
    backgroundColor: '#2E7D32',
  },
  reminderButtonInactive: {
    backgroundColor: '#B75B3E',
  },
  reminderButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  reminderButtonTextActive: {
    color: '#FFF',
  },
  reminderButtonTextInactive: {
    color: '#FFF',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#E8D9C9',
    gap: 6,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F2924',
  },
  fallbackContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2F2924',
  },
  fallbackMessage: {
    fontSize: 13,
    color: '#7B6F65',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  fallbackButton: {
    marginTop: 10,
    backgroundColor: '#B75B3E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  fallbackButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
