import { EventCard } from '@/src/components/EventCard';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/FeedbackStates';
import { OfflineBanner } from '@/src/components/OfflineBanner';
import { useFavorites } from '@/src/contexts/FavoritesContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { getEvents } from '@/src/services/api';
import { loadCachedEvents, saveCachedEvents } from '@/src/services/storage';
import { CampusEvent, EventFilter } from '@/src/types/event';
import { Theme } from '../../constants/Colors';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Week 3: Discriminated union for list state
type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; events: CampusEvent[]; isOffline: boolean; updatedAt: string | null };

const FILTERS: EventFilter[] = ['all', 'Academic', 'Workshop', 'Sports', 'Cultural', 'Career'];
const FILTER_LABELS: Record<EventFilter, string> = {
  all: 'ทั้งหมด',
  Academic: 'วิชาการ',
  Workshop: 'เวิร์กช็อป',
  Sports: 'กีฬา',
  Cultural: 'วัฒนธรรม',
  Career: 'อาชีพ',
};

export default function EventsScreen() {
  const { width } = useWindowDimensions(); // Week 3: responsive
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { session } = useAuth();
  // ชื่อบัญชีจริง — ใช้แยกกิจกรรมที่สร้างเองตามบัญชี (ถ้ายังไม่ล็อกอินใช้ 'guest')
  const account = session.status === 'authenticated' ? session.accountKey : 'guest';

  const [listState, setListState] = useState<ListState>({ status: 'loading' });
  const [searchText, setSearchText] = useState(''); // Week 5: local UI state
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  // มีข้อมูลแสดงอยู่แล้วหรือยัง (ใช้ตัดสินใจว่า refocus ครั้งถัดไปจะโหลดแบบเงียบหรือไม่)
  const hasDataRef = useRef(false);

  const fetchEvents = useCallback(async (isRefresh = false, signal?: AbortSignal) => {
    if (!isRefresh) setListState({ status: 'loading' });

    // Week 7: Show cache immediately while fetching
    const { events: cached, updatedAt } = await loadCachedEvents();
    if (cached.length > 0 && !isRefresh) {
      hasDataRef.current = true;
      setListState({ status: 'ready', events: cached, isOffline: false, updatedAt });
    }

    try {
      const events = await getEvents(account, signal);
      await saveCachedEvents(events);
      hasDataRef.current = true;
      setListState({ status: 'ready', events, isOffline: false, updatedAt: new Date().toISOString() });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      // Offline fallback
      if (cached.length > 0) {
        hasDataRef.current = true;
        setListState({ status: 'ready', events: cached, isOffline: true, updatedAt });
      } else {
        setListState({
          status: 'error',
          message: err instanceof Error ? err.message : 'โหลดกิจกรรมไม่สำเร็จ',
        });
      }
    }
  }, [account]);

  // โหลด/รีเฟรชทุกครั้งที่หน้าได้ focus — ทำให้การสร้าง/ลบกิจกรรมเห็นผลทันทีเมื่อกลับมาหน้านี้
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      fetchEvents(hasDataRef.current, controller.signal);
      return () => controller.abort();
    }, [fetchEvents]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents(true);
    setRefreshing(false);
  }, [fetchEvents]);

  // Week 5: Derived value — no duplicate state
  const filteredEvents =
    listState.status === 'ready'
      ? listState.events.filter((e) => {
          const matchesSearch =
            e.title.toLowerCase().includes(searchText.toLowerCase()) ||
            e.location.name.toLowerCase().includes(searchText.toLowerCase());
          const matchesFilter = activeFilter === 'all' || e.category === activeFilter;
          return matchesSearch && matchesFilter;
        })
      : [];

  const numColumns = width >= 720 ? 2 : 1;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {/* Offline Banner */}
      {listState.status === 'ready' && listState.isOffline && (
        <OfflineBanner updatedAt={listState.updatedAt} />
      )}

      {/* Search (Week 5) */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหากิจกรรม..."
          value={searchText}
          onChangeText={setSearchText}
          accessibilityLabel="ค้นหากิจกรรม"
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {/* Category Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f)}
            accessibilityRole="button"
            accessibilityLabel={`กรองตาม ${FILTER_LABELS[f]}`}
            accessibilityState={{ selected: activeFilter === f }}
          >
            <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>
              {FILTER_LABELS[f]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      {listState.status === 'loading' ? (
        <LoadingState message="กำลังโหลดกิจกรรม..." />
      ) : listState.status === 'error' ? (
        <ErrorState message={listState.message} onRetry={() => fetchEvents()} />
      ) : (
        <FlatList
          key={numColumns} // Week 3: reset layout on column change
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => (
            <View style={[styles.cardWrapper, numColumns === 2 && styles.cardWrapperHalf]}>
              <EventCard
                event={item}
                isFavorite={favoriteIds.includes(item.id)}
                onOpen={(id) => router.push({ pathname: '/events/[id]', params: { id } })}
                onToggleFavorite={toggleFavorite}
              />
            </View>
          )}
          contentContainerStyle={[
            styles.list,
            filteredEvents.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={
            <EmptyState
              title="ไม่พบกิจกรรม"
              subtitle="ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
              actionLabel="ล้างตัวกรอง"
              onAction={() => { setSearchText(''); setActiveFilter('all'); }}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Theme.cream },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: {
    backgroundColor: Theme.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Theme.creamBorder,
    color: Theme.text,
  },
  filterRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.creamBorder,
  },
  chipActive: { backgroundColor: Theme.primary, borderColor: Theme.primary },
  chipText: { fontSize: 13, color: Theme.textMuted },
  chipTextActive: { color: Theme.onPrimary, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  emptyList: { flexGrow: 1 },
  cardWrapper: { flex: 1 },
  cardWrapperHalf: { flex: 0.5 },
});
