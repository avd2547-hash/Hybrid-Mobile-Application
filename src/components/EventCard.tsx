import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SEAT_COLORS, Theme, getSeatStatus } from '../../constants/Colors';
import { CampusEvent } from '../types/event';

// Week 2: Typed props, callbacks, no internal mock data
export type EventCardProps = {
  event: CampusEvent;
  isFavorite: boolean;
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
};

// สี badge แต่ละหมวด — อยู่ในโทนเดียวกับธีม (เฉดกรม + ทอง)
const CATEGORY_COLORS: Record<CampusEvent['category'], string> = {
  Academic: '#16305A',
  Workshop: '#C9A227',
  Sports: '#2A4D82',
  Cultural: '#6E8FBF',
  Career: '#0C1E3C',
};

export function EventCard({ event, isFavorite, onOpen, onToggleFavorite }: EventCardProps) {
  const dateStr = new Date(event.startsAt).toLocaleDateString('th-TH', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const spotsLeft = event.capacity - event.registeredCount;
  const categoryColor = CATEGORY_COLORS[event.category];
  // สีที่นั่งตามสถานะ: ปกติ = เขียว · ใกล้เต็ม = ชมพู (แชร์กับหน้ารายละเอียด)
  const seat = SEAT_COLORS[getSeatStatus(spotsLeft, event.capacity)];

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onOpen(event.id)}
      accessibilityRole="button"
      accessibilityLabel={`กิจกรรม ${event.title}`}
      accessibilityHint="แตะเพื่อดูรายละเอียด"
    >
      {event.imageUrl ? (
        <Image
          source={{ uri: event.imageUrl }}
          style={styles.image}
          accessibilityLabel={`ภาพกิจกรรม ${event.title}`}
        />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: categoryColor }]}>
          <Text style={styles.imagePlaceholderText}>{event.category}</Text>
        </View>
      )}

      <View style={styles.body}>
        {/* Category badge */}
        <View style={[styles.badge, { backgroundColor: `${categoryColor}20` }]}>
          <Text style={[styles.badgeText, { color: categoryColor }]}>{event.category}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.date}>{dateStr}</Text>
        <Text style={styles.location} numberOfLines={1}>📍 {event.location.name}</Text>

        <View style={styles.footer}>
          <View style={[styles.spotsBadge, { backgroundColor: seat.bg }]}>
            <Text style={[styles.spots, { color: seat.text }]}>
              {spotsLeft > 0 ? `ที่นั่งว่าง ${spotsLeft} ที่` : 'เต็มแล้ว'}
            </Text>
          </View>
          {/* ไม่ใส่ accessibilityRole="button" เพื่อเลี่ยง nested <button> บน web */}
          <Pressable
            style={styles.favButton}
            onPress={() => onToggleFavorite(event.id)}
            accessibilityLabel={`${isFavorite ? 'นำออกจาก' : 'เพิ่มใน'}รายการโปรด ${event.title}`}
          >
            <Text style={styles.favIcon}>{isFavorite ? '★' : '☆'}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: { opacity: 0.92 },
  image: { width: '100%', height: 160 },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  body: { padding: 16, gap: 6 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '700', color: Theme.text },
  date: { fontSize: 13, color: Theme.textMuted },
  location: { fontSize: 13, color: Theme.textMuted },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  spotsBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  spots: { fontSize: 12, fontWeight: '700' },
  favButton: { padding: 4, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  favIcon: { fontSize: 24, color: Theme.accent },
});
