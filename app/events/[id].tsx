import { ErrorState, LoadingState } from '@/src/components/FeedbackStates';
import { EventMap } from '@/src/components/EventMap';
import { RouteSteps } from '@/src/components/RouteSteps';
import { SEAT_COLORS, Theme, getSeatStatus } from '../../constants/Colors';
import { useFavorites } from '@/src/contexts/FavoritesContext';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  cancelRegistration,
  deleteEvent,
  getEventById,
  getJoinedEventIds,
} from '@/src/services/api';
import {
  cancelEventReminder,
  formatLeadTime,
  getStoredReminders,
  REMINDER_OPTIONS,
  scheduleEventReminder,
} from '@/src/services/notifications';
import { CampusEvent } from '@/src/types/event';
import {
  formatDistance,
  googleMapsDirectionsUrl,
  haversineDistanceKm,
} from '@/src/services/distance';
import { fetchRoute, RouteResult } from '@/src/services/routing';
import * as Location from 'expo-location';
import { Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Week 3: Discriminated union for page state
type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not-found' }
  | { status: 'ready'; event: CampusEvent };

export default function EventDetailScreen() {
  // Week 4: Validate route param before use
  const { id, userLat, userLon } = useLocalSearchParams<{
    id?: string | string[];
    userLat?: string | string[];
    userLon?: string | string[];
  }>();
  const eventId = Array.isArray(id) ? id[0] : id;
  // พิกัด override ผ่าน URL (ใช้ทดสอบ/ดีโม เช่น /events/1?userLat=16.44&userLon=102.82)
  const overrideLat = Number(Array.isArray(userLat) ? userLat[0] : userLat);
  const overrideLon = Number(Array.isArray(userLon) ? userLon[0] : userLon);
  const hasOverride =
    Number.isFinite(overrideLat) && Number.isFinite(overrideLon);

  const { favoriteIds, toggleFavorite } = useFavorites();
  const { session } = useAuth();
  const account = session.status === 'authenticated' ? session.accountKey : 'guest';
  const [pageState, setPageState] = useState<PageState>({ status: 'loading' });
  const [hasReminder, setHasReminder] = useState(false);
  const [activeLeadSeconds, setActiveLeadSeconds] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState(30); // default: 30 วินาที (เห็นผลไวสำหรับทดสอบ)
  const [customMode, setCustomMode] = useState(false); // เลือก "กำหนดเอง" — กรอกนาทีเอง
  const [customMinutes, setCustomMinutes] = useState('10');
  const [reminderLoading, setReminderLoading] = useState(false);
  // สถานะการเข้าร่วม/ลบกิจกรรม (บัญชีที่ล็อกอินอยู่)
  const [isJoined, setIsJoined] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Week 10: Location permission + ตำแหน่งปัจจุบันของโทรศัพท์
  const [locationGranted, setLocationGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // เส้นทางขับรถจริง (turn-by-turn) จาก OSRM
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeExpanded, setRouteExpanded] = useState(false);

  useEffect(() => {
    // ถ้ามีพิกัด override ผ่าน URL ใช้เลย (โหมดทดสอบ)
    if (hasOverride) {
      setLocationGranted(true);
      setUserLocation({ latitude: overrideLat, longitude: overrideLon });
      return;
    }
    // (โหลดเส้นทางเกิดใน effect ด้านล่างเมื่อ event + userLocation พร้อม)
    // Week 10: ขอสิทธิ์ foreground แล้วอ่านพิกัดจริงเพื่อคำนวณระยะทาง
    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(granted);
      if (!granted) return;
      try {
        const pos = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch {
        // ไม่สามารถอ่านตำแหน่งได้ — ไม่แสดงระยะทาง
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!eventId) {
      setPageState({ status: 'not-found' });
      return;
    }
    const controller = new AbortController();
    getEventById(account, eventId, controller.signal)
      .then((event) => {
        if (!event) {
          setPageState({ status: 'not-found' });
          return;
        }
        setPageState({ status: 'ready', event });
        // Load reminder state + lead time ที่ตั้งไว้
        getStoredReminders().then((reminders) => {
          const r = reminders[eventId];
          setHasReminder(!!r);
          if (r) setActiveLeadSeconds(r.leadSeconds);
        });
        // โหลดสถานะการเข้าร่วม (ลงทะเบียนไว้แล้วหรือยัง)
        setIsJoined(false);
        getJoinedEventIds(account)
          .then((ids) => {
            if (!controller.signal.aborted) setIsJoined(ids.includes(eventId));
          })
          .catch(() => {});
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setPageState({ status: 'error', message: 'โหลดรายละเอียดไม่สำเร็จ' });
      });
    return () => controller.abort();
  }, [eventId, account]);

  // โหลดเส้นทางขับรถจริงจาก OSRM เมื่อมีตำแหน่งผู้ใช้และ event พร้อม
  useEffect(() => {
    if (pageState.status !== 'ready' || !userLocation) return;
    const { latitude, longitude } = pageState.event.location;
    const controller = new AbortController();
    setRoute(null);
    fetchRoute(userLocation, { latitude, longitude }, controller.signal)
      .then(setRoute)
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        // โหลดเส้นทางไม่สำเร็จ — แสดงแค่เส้นตรง/ระยะตรงแทน
        setRoute(null);
      });
    return () => controller.abort();
  }, [pageState.status === 'ready' ? pageState.event.id : null, userLocation?.latitude, userLocation?.longitude]);

  // Week 11: Schedule / Cancel reminder (เลือกเวลาล่วงหน้าได้ + กำหนดเองเป็นนาที)
  // คำนวณ lead seconds จริงที่จะใช้: preset chip หรือค่าที่กรอกเอง (นาที)
  const effectiveLead = customMode
    ? ((): number | null => {
        const n = Number(customMinutes);
        if (!customMinutes.trim() || isNaN(n) || n < 1) return null;
        return Math.round(n * 60);
      })()
    : selectedLead;

  const handleToggleReminder = useCallback(async () => {
    if (pageState.status !== 'ready') return;
    if (effectiveLead === null) {
      Alert.alert('ระบุเวลาไม่ถูกต้อง', 'กรุณากรอกจำนวนนาทีเป็นตัวเลขมากกว่า 0');
      return;
    }
    setReminderLoading(true);
    try {
      if (hasReminder) {
        await cancelEventReminder(pageState.event.id);
        setHasReminder(false);
        setActiveLeadSeconds(null);
        Alert.alert('ยกเลิกการแจ้งเตือนแล้ว');
      } else {
        await scheduleEventReminder(pageState.event, effectiveLead);
        setHasReminder(true);
        setActiveLeadSeconds(effectiveLead);
        Alert.alert(
          'ตั้งการแจ้งเตือนแล้ว',
          effectiveLead === 0
            ? 'จะมีการแจ้งเตือนถึงคุณทันที (ภายใน ~1 วินาที)'
            : `คุณจะได้รับการแจ้งเตือน ${formatLeadTime(effectiveLead)}ก่อนกิจกรรม`,
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message === 'reminder-time-has-passed'
          ? 'กิจกรรมนี้ใกล้จะเริ่มหรือเริ่มไปแล้ว'
          : err instanceof Error && err.message === 'notification-permission-denied'
          ? 'กรุณาอนุญาตการแจ้งเตือนในการตั้งค่า'
          : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      Alert.alert('ไม่สามารถตั้งการแจ้งเตือนได้', msg);
    } finally {
      setReminderLoading(false);
    }
  }, [pageState, hasReminder, effectiveLead]);

  // ยกเลิกการเข้าร่วมกิจกรรม (สำหรับกิจกรรมที่ลงทะเบียนแล้ว)
  const handleCancelRegistration = useCallback(() => {
    if (pageState.status !== 'ready') return;
    Alert.alert(
      'ยกเลิกการเข้าร่วม',
      `ต้องการยกเลิกการลงทะเบียนกิจกรรม "${pageState.event.title}" ใช่หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ยืนยัน',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRegistration(account, pageState.event.id);
              setIsJoined(false);
              Alert.alert('ยกเลิกการเข้าร่วมแล้ว');
            } catch {
              Alert.alert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่อีกครั้ง');
            }
          },
        },
      ],
    );
  }, [pageState, account]);

  // ลบกิจกรรมที่บัญชีนี้สร้างเอง (กิจกรรม mock ของระบบจะไม่แสดงปุ่มนี้)
  const handleDeleteEvent = useCallback(() => {
    if (pageState.status !== 'ready') return;
    const current = pageState.event;
    Alert.alert(
      'ลบกิจกรรม',
      `ต้องการลบกิจกรรม "${current.title}" ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              // เก็บกวาดสิ่งที่ผูกกับกิจกรรมนี้: รายการโปรด + การแจ้งเตือน
              if (favoriteIds.includes(current.id)) toggleFavorite(current.id);
              if (hasReminder) await cancelEventReminder(current.id);
              await deleteEvent(account, current.id);
              Alert.alert('ลบกิจกรรมแล้ว', undefined, [
                { text: 'ตกลง', onPress: () => router.back() },
              ]);
            } catch (err: unknown) {
              Alert.alert(
                'ลบไม่สำเร็จ',
                err instanceof Error && err.message === 'event-not-found'
                  ? 'กิจกรรมนี้ไม่ได้ถูกสร้างด้วยบัญชีนี้'
                  : 'กรุณาลองใหม่อีกครั้ง',
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [pageState, account, favoriteIds, hasReminder, toggleFavorite]);

  if (!eventId) {
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <ErrorState message="ไม่พบ ID ของกิจกรรม" onRetry={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (pageState.status === 'loading') {
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <LoadingState message="กำลังโหลดกิจกรรม..." />
      </SafeAreaView>
    );
  }

  if (pageState.status === 'error') {
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <ErrorState message={pageState.message} onRetry={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (pageState.status === 'not-found') {
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <ErrorState message="ไม่พบกิจกรรมนี้ อาจถูกลบไปแล้ว" onRetry={() => router.back()} />
      </SafeAreaView>
    );
  }

  const { event } = pageState;
  const isFavorite = favoriteIds.includes(event.id);
  const spotsLeft = event.capacity - event.registeredCount;
  const seat = SEAT_COLORS[getSeatStatus(spotsLeft, event.capacity)];
  const distanceKm = userLocation
    ? haversineDistanceKm(userLocation, {
        latitude: event.location.latitude,
        longitude: event.location.longitude,
      })
    : null;

  const dateStr = new Date(event.startsAt).toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero Image */}
        {event.imageUrl ? (
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.heroImage}
            accessibilityLabel={`ภาพกิจกรรม ${event.title}`}
          />
        ) : null}

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{event.title}</Text>
            <Pressable
              style={styles.favButton}
              onPress={() => toggleFavorite(event.id)}
              accessibilityRole="button"
              accessibilityLabel={`${isFavorite ? 'นำออกจาก' : 'เพิ่มใน'}รายการโปรด`}
            >
              <Text style={styles.favIcon}>{isFavorite ? '★' : '☆'}</Text>
            </Pressable>
          </View>

          <Text style={styles.dateText}>📅 {dateStr}</Text>
          <Text style={styles.locationText}>📍 {event.location.name}</Text>

          {/* ระยะทางจากโทรศัพท์ถึงสถานที่ (Week 10) */}
          {distanceKm !== null && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>
                🚩 ห่างจากคุณ {formatDistance(distanceKm)} จึงจะถึงสถานที่
              </Text>
            </View>
          )}

          {/* Spots */}
          <View style={[styles.spotsBadge, { backgroundColor: seat.bg }]}>
            <Text style={[styles.spotsText, { color: seat.text }]}>
              {spotsLeft > 0 ? `ที่นั่งว่าง ${spotsLeft} / ${event.capacity} ที่` : '🔴 เต็มแล้ว'}
            </Text>
          </View>

          {/* สถานะการเข้าร่วม */}
          {isJoined && (
            <View style={styles.joinedBadge}>
              <Text style={styles.joinedBadgeText}>✅ คุณลงทะเบียนกิจกรรมนี้แล้ว</Text>
            </View>
          )}

          {/* Description */}
          <Text style={styles.sectionTitle}>รายละเอียด</Text>
          <Text style={styles.description}>{event.description}</Text>

          {/* Map (Week 10): เส้นทาง + ระยะทางจากตำแหน่งผู้ใช้ */}
          <Text style={styles.sectionTitle}>แผนที่สถานที่จัดงาน</Text>
          <EventMap
            title={event.title}
            venueName={event.location.name}
            latitude={event.location.latitude}
            longitude={event.location.longitude}
            userLocation={userLocation}
            route={route}
          />

          {/* Turn-by-turn: คำแนะนำเลี้ยวซ้าย/เลี้ยวขวาตามถนนจริง */}
          {route && route.steps.length > 0 && (
            <RouteSteps
              steps={route.steps}
              distanceMeters={route.distanceMeters}
              durationSeconds={route.durationSeconds}
              expanded={routeExpanded}
              onToggleExpanded={() => setRouteExpanded((v) => !v)}
            />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Reminder lead time picker (Week 11) */}
          {!hasReminder && (
            <View style={styles.leadPicker}>
              <Text style={styles.leadPickerLabel}>แจ้งเตือนล่วงหน้า:</Text>
              <View style={styles.leadOptions}>
                {REMINDER_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.seconds}
                    style={[styles.leadChip, !customMode && selectedLead === opt.seconds && styles.leadChipActive]}
                    onPress={() => {
                      setCustomMode(false);
                      setSelectedLead(opt.seconds);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: !customMode && selectedLead === opt.seconds }}
                    accessibilityLabel={`แจ้งเตือนล่วงหน้า ${opt.label}`}
                  >
                    <Text
                      style={[styles.leadChipText, !customMode && selectedLead === opt.seconds && styles.leadChipTextActive]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
                {/* กำหนดเอง: กรอกจำนวนนาทีเองได้ */}
                <Pressable
                  style={[styles.leadChip, customMode && styles.leadChipActive]}
                  onPress={() => setCustomMode(true)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: customMode }}
                  accessibilityLabel="กำหนดเวลาแจ้งเตือนเอง"
                >
                  <Text style={[styles.leadChipText, customMode && styles.leadChipTextActive]}>
                    กำหนดเอง...
                  </Text>
                </Pressable>
              </View>

              {/* ช่องกรอกนาที (แสดงเมื่อเลือกกำหนดเอง) */}
              {customMode && (
                <View style={styles.customLeadRow}>
                  <TextInput
                    style={styles.customLeadInput}
                    value={customMinutes}
                    onChangeText={(v) => setCustomMinutes(v.replace(/[^0-9]/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                    placeholder="เช่น 120"
                    placeholderTextColor={Theme.textMuted}
                    accessibilityLabel="จำนวนนาทีที่ต้องการแจ้งเตือนล่วงหน้า"
                  />
                  <Text style={styles.customLeadUnit}>นาทีก่อนกิจกรรม</Text>
                </View>
              )}
            </View>
          )}

          {/* Reminder toggle (Week 11) */}
          <Pressable
            style={[styles.reminderButton, hasReminder && styles.reminderButtonActive]}
            onPress={handleToggleReminder}
            disabled={reminderLoading}
            accessibilityRole="button"
            accessibilityLabel={                  hasReminder ? 'ยกเลิกการแจ้งเตือน' : `ตั้งการแจ้งเตือน${effectiveLead !== null ? ` ${formatLeadTime(effectiveLead)}ก่อน` : ''}`
            }
          >
            <Text style={styles.reminderText}>
              {reminderLoading
                ? '...'
                : hasReminder
                  ? `🔔 ยกเลิกการแจ้งเตือน (ล่วงหน้า ${activeLeadSeconds ? formatLeadTime(activeLeadSeconds) : ''})`
                  : selectedLead === 0 && !customMode
                    ? '🔔 แจ้งเตือนทันทีที่กด'
                    : effectiveLead !== null && effectiveLead > 0
                      ? `🔕 แจ้งเตือน ${formatLeadTime(effectiveLead)}ก่อนกิจกรรม`
                      : '🔔 แจ้งเตือนล่วงหน้า'}
            </Text>
          </Pressable>

          {/* นำทางด้วย Google Maps (อ้างอิงเส้นทางจริง) */}
          <Pressable
            style={styles.mapsButton}
            onPress={() =>
              Linking.openURL(
                googleMapsDirectionsUrl({
                  latitude: event.location.latitude,
                  longitude: event.location.longitude,
                }),
              )
            }
            accessibilityRole="button"
            accessibilityLabel="นำทางไปสถานที่จัดกิจกรรมด้วย Google Maps"
          >
            <Text style={styles.mapsButtonText}>
              🧭 นำทางด้วย Google Maps
            </Text>
          </Pressable>

          {/* Register */}
          <Pressable
            style={[styles.registerButton, spotsLeft <= 0 && styles.registerButtonDisabled]}
            disabled={spotsLeft <= 0}
            onPress={() => router.push({ pathname: '/register/[id]', params: { id: event.id } })}
            accessibilityRole="button"
            accessibilityLabel={spotsLeft > 0 ? 'ลงทะเบียนเข้าร่วม' : 'กิจกรรมนี้เต็มแล้ว'}
          >
            <Text style={styles.registerText}>
              {spotsLeft > 0 ? 'ลงทะเบียนเข้าร่วม' : 'กิจกรรมเต็มแล้ว'}
            </Text>
          </Pressable>

          {/* ยกเลิกการเข้าร่วม (เฉพาะกิจกรรมที่ลงทะเบียนแล้ว) */}
          {isJoined && (
            <Pressable
              style={styles.cancelJoinButton}
              onPress={handleCancelRegistration}
              accessibilityRole="button"
              accessibilityLabel="ยกเลิกการเข้าร่วมกิจกรรมนี้"
            >
              <Text style={styles.cancelJoinText}>✕ ยกเลิกการเข้าร่วมกิจกรรมนี้</Text>
            </Pressable>
          )}

          {/* ลบกิจกรรม (เฉพาะกิจกรรมที่บัญชีนี้สร้างเอง) */}
          {event.id.startsWith('user-') && (
            <Pressable
              style={styles.deleteButton}
              onPress={handleDeleteEvent}
              disabled={deleting}
              accessibilityRole="button"
              accessibilityLabel="ลบกิจกรรมนี้"
            >
              <Text style={styles.deleteText}>
                {deleting ? 'กำลังลบ...' : '🗑 ลบกิจกรรมนี้'}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Theme.cream },
  scroll: { paddingBottom: 40 },
  heroImage: { width: '100%', height: 220 },
  content: { padding: 20, gap: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: Theme.text, flex: 1 },
  favButton: { padding: 8, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  favIcon: { fontSize: 28, color: Theme.accent },
  dateText: { fontSize: 14, color: Theme.textMuted },
  locationText: { fontSize: 14, color: Theme.textMuted },
  distanceBadge: {
    alignSelf: 'flex-start', backgroundColor: Theme.primaryTint,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: Theme.primaryBorder,
  },
  distanceText: { fontSize: 13, color: Theme.primary, fontWeight: '600' },
  spotsBadge: {
    alignSelf: 'flex-start', backgroundColor: Theme.successBg,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
  },
  spotsText: { fontSize: 13, color: Theme.successText, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Theme.text, marginTop: 8 },
  description: { fontSize: 14, color: Theme.textMuted, lineHeight: 22 },
  actions: { padding: 20, gap: 12 },
  leadPicker: { gap: 8 },
  leadPickerLabel: { fontSize: 13, fontWeight: '600', color: Theme.textMuted },
  leadOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  leadChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: Theme.surface, borderWidth: 1, borderColor: Theme.creamBorder,
  },
  leadChipActive: { backgroundColor: Theme.primary, borderColor: Theme.primary },
  leadChipText: { fontSize: 13, color: Theme.textMuted },
  leadChipTextActive: { color: Theme.onPrimary, fontWeight: '700' },
  customLeadRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Theme.surface, borderWidth: 1, borderColor: Theme.creamBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
  },
  customLeadInput: {
    fontSize: 16, fontWeight: '700', color: Theme.text,
    minWidth: 64, textAlign: 'center',
    backgroundColor: Theme.creamDark, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8,
  },
  customLeadUnit: { fontSize: 13, color: Theme.textMuted, flex: 1 },
  reminderButton: {
    backgroundColor: Theme.surface, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Theme.creamBorder,
  },
  reminderButtonActive: { backgroundColor: Theme.primaryTint, borderColor: Theme.primary },
  reminderText: { fontSize: 14, fontWeight: '700', color: Theme.text },
  mapsButton: {
    backgroundColor: Theme.primaryTint, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Theme.primary,
  },
  mapsButtonText: { color: Theme.primary, fontWeight: '700', fontSize: 14 },
  registerButton: { backgroundColor: Theme.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  registerButtonDisabled: { backgroundColor: Theme.creamBorder },
  registerText: { color: Theme.onPrimary, fontWeight: '700', fontSize: 16 },
  joinedBadge: {
    alignSelf: 'flex-start', backgroundColor: Theme.primaryTint,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: Theme.primaryBorder,
  },
  joinedBadgeText: { fontSize: 13, color: Theme.primary, fontWeight: '700' },
  cancelJoinButton: {
    backgroundColor: Theme.surface, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Theme.danger,
  },
  cancelJoinText: { color: Theme.danger, fontWeight: '700', fontSize: 14 },
  deleteButton: {
    backgroundColor: Theme.dangerBg, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Theme.danger,
  },
  deleteText: { color: Theme.danger, fontWeight: '700', fontSize: 14 },
});
