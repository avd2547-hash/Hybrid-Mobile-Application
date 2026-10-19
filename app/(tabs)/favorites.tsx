import { EventCard } from '@/src/components/EventCard';
import { EmptyState } from '@/src/components/FeedbackStates';
import { useFavorites } from '@/src/contexts/FavoritesContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { getEvents } from '@/src/services/api';
import { loadCachedEvents } from '@/src/services/storage';
import { CampusEvent } from '@/src/types/event';
import { Theme } from '../../constants/Colors';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { session } = useAuth();
  const account = session.status === 'authenticated' ? session.accountKey : 'guest';
  const [allEvents, setAllEvents] = useState<CampusEvent[]>([]);

  // โหลด/รีเฟรชทุกครั้งที่หน้าได้ focus — ให้รายการโปรดตรงปัจจุบันเสมอ (เช่น หลังลบกิจกรรม)
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      // Week 7: ถ้า network ล้ม ใช้ cache เป็น fallback เพื่อให้ favorites ยังแสดง offline
      getEvents(account, controller.signal)
        .then(setAllEvents)
        .catch(async () => {
          const { events } = await loadCachedEvents();
          if (!controller.signal.aborted) setAllEvents(events);
        });
      return () => controller.abort();
    }, [account]),
  );

  // Derived state — no duplicate array stored (Week 5)
  const favoriteEvents = allEvents.filter((e) => favoriteIds.includes(e.id));

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {favoriteIds.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.countText}>บันทึกไว้ {favoriteIds.length} กิจกรรม</Text>
        </View>
      )}
      <FlatList
        data={favoriteEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            isFavorite
            onOpen={(id) => router.push({ pathname: '/events/[id]', params: { id } })}
            onToggleFavorite={toggleFavorite}
          />
        )}
        contentContainerStyle={[
          styles.list,
          favoriteEvents.length === 0 && styles.emptyList,
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <EmptyState
            title="ยังไม่มีกิจกรรมในรายการโปรด"
            subtitle="แตะดาว ★ บนกิจกรรมที่สนใจเพื่อบันทึกไว้"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Theme.cream },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  countText: { fontSize: 14, color: Theme.textMuted, fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  emptyList: { flexGrow: 1 },
});
