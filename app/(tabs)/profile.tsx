import { useAuth } from '@/src/contexts/AuthContext';
import { useFavorites } from '@/src/contexts/FavoritesContext';
import { UserProfile } from '@/src/types/event';
import { Theme } from '../../constants/Colors';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Week 1-2: typed StudentProfile object
const STUDENT_PROFILE: UserProfile = {
  name: 'นักศึกษา Campus Events',
  email: 'student@kku.ac.th',
  program: 'วิทยาการคอมพิวเตอร์และสารสนเทศ',
  faculty: 'คณะสหวิทยาการ มหาวิทยาลัยขอนแก่น',
  interests: ['Mobile Development', 'Campus Events', 'AI & Machine Learning', 'UX Design'],
  role: 'student',
};

export default function ProfileScreen() {
  const { session, logout, updateName, updatePhoto } = useAuth();
  const { favoriteIds, clearFavorites } = useFavorites();

  // แก้ไขโปรไฟล์: ชื่อ + รูป
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  const user =
    session.status === 'authenticated'
      ? session.user
      : { name: STUDENT_PROFILE.name };

  const handleLogout = () => {
    Alert.alert('ออกจากระบบ', 'คุณต้องการออกจากระบบใช่หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ออกจากระบบ',
        style: 'destructive',
        onPress: async () => {
          clearFavorites(); // ล้าง local state
          await logout();
        },
      },
    ]);
  };

  // เลือกรูปโปรไฟล์จาก gallery (native) หรือ file input (web)
  const handlePickPhoto = async () => {
    if (session.status !== 'authenticated') {
      Alert.alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }
    if (Platform.OS === 'web') {
      pickPhotoWeb();
      return;
    }
    // Native: ขอสิทธิ์กล้อง/รูปภาพ แล้วเปิด image picker
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('ไม่ได้รับอนุญาต', 'กรุณาอนุญาตการเข้าถึงรูปภาพในการตั้งค่า');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    // เก็บเป็น base64 data URI เพื่อให้ยังแสดงได้หลังรีสตาร์ทแอป (file cache URI อาจถูกลบ)
    const uri = asset.base64
      ? `data:image/jpeg;base64,${asset.base64}`
      : asset.uri;
    try {
      await updatePhoto(uri);
      Alert.alert('บันทึกรูปโปรไฟล์แล้ว');
    } catch {
      Alert.alert('ไม่สามารถบันทึกรูปได้');
    }
  };

  // Web: ใช้ <input type=file> เพราะ expo-image-picker ไม่รองรับ web
  const pickPhotoWeb = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        Alert.alert('ไฟล์ใหญ่เกินไป', 'กรุณาเลือกรูปขนาดไม่เกิน 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await updatePhoto(String(reader.result));
          Alert.alert('บันทึกรูปโปรไฟล์แล้ว');
        } catch {
          Alert.alert('ไม่สามารถบันทึกรูปได้');
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // เปิด dialog แก้ไขชื่อ
  const openEditName = () => {
    if (session.status !== 'authenticated') {
      Alert.alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }
    setNameDraft(session.user.name);
    setEditNameVisible(true);
  };

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      await updateName(nameDraft);
      setEditNameVisible(false);
      Alert.alert('เปลี่ยนชื่อเรียบร้อยแล้ว');
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message === 'name-taken'
          ? 'ชื่อนี้มีผู้ใช้แล้ว'
          : 'กรุณากรอกชื่อให้ถูกต้อง';
      Alert.alert('เปลี่ยนชื่อไม่สำเร็จ', msg);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar + รูปโปรไฟล์ (กดเพื่อเปลี่ยนรูป) + ชื่อ (กดเพื่อแก้ไข) */}
        <View style={styles.avatarContainer}>
          <Pressable
            onPress={handlePickPhoto}
            accessibilityRole="button"
            accessibilityLabel="เปลี่ยนรูปโปรไฟล์"
          >
            {session.status === 'authenticated' && session.user.photoUri ? (
              <Image source={{ uri: session.user.photoUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {/* ป้ายกล้องมุม avatar */}
            {session.status === 'authenticated' && (
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraBadgeText}>📷</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={openEditName}
            accessibilityRole="button"
            accessibilityLabel="แก้ไขชื่อ"
          >
            <Text style={styles.name}>{user.name}</Text>
            {session.status === 'authenticated' && (
              <Text style={styles.editHint}>✏️ แตะเพื่อแก้ไขชื่อ · แตะรูปเพื่อเปลี่ยนรูป</Text>
            )}
          </Pressable>
          {session.status === 'authenticated' && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {session.user.role === 'organizer' ? '🏢 ผู้จัดกิจกรรม' : '🎓 นักศึกษา'}
              </Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.card}>
          <InfoRow label="สาขาวิชา" value={STUDENT_PROFILE.program} />
          <InfoRow label="คณะ" value={STUDENT_PROFILE.faculty} />
        </View>

        {/* Interests */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ความสนใจ</Text>
          <View style={styles.tags}>
            {STUDENT_PROFILE.interests.map((interest) => (
              <View key={interest} style={styles.tag}>
                <Text style={styles.tagText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label="กิจกรรมโปรด" value={String(favoriteIds.length)} />
        </View>

        {/* Logout */}
        {session.status === 'authenticated' && (
          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="ออกจากระบบ"
          >
            <Text style={styles.logoutText}>ออกจากระบบ</Text>
          </Pressable>
        )}

        {/* Modal แก้ไขชื่อ */}
        <Modal
          visible={editNameVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEditNameVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>แก้ไขชื่อ</Text>
              <TextInput
                style={styles.modalInput}
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="ชื่อผู้ใช้"
                autoCapitalize="none"
                maxLength={30}
                accessibilityLabel="ชื่อผู้ใช้ใหม่"
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setEditNameVisible(false)}
                >
                  <Text style={styles.modalButtonCancelText}>ยกเลิก</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={handleSaveName}
                  disabled={savingName || !nameDraft.trim()}
                >
                  <Text style={styles.modalButtonSaveText}>
                    {savingName ? 'กำลังบันทึก...' : 'บันทึก'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Week 1: Definition of Done checklist note */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>📱 Campus Events Mobile</Text>
          <Text style={styles.infoBoxText}>
            สัปดาห์ 1-11 · Expo SDK 57 · React Native · TypeScript · Expo Router
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Theme.cream },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  avatarContainer: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Theme.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 36, color: Theme.cream, fontWeight: '700' },
  cameraBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: Theme.surface, borderRadius: 14,
    width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Theme.primaryBorder,
  },
  cameraBadgeText: { fontSize: 13 },
  editHint: { fontSize: 11, color: Theme.textFaint, marginTop: 2 },
  name: { fontSize: 22, fontWeight: '700', color: Theme.text },
  email: { fontSize: 14, color: Theme.textMuted },
  roleBadge: { backgroundColor: Theme.primaryTint, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  roleBadgeText: { fontSize: 13, color: Theme.primary, fontWeight: '600' },
  card: {
    backgroundColor: Theme.surface, borderRadius: 16, padding: 16, gap: 12,
    shadowColor: Theme.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Theme.text, marginBottom: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  infoLabel: { fontSize: 13, color: Theme.textFaint, flex: 1 },
  infoValue: { fontSize: 13, color: Theme.text, fontWeight: '600', flex: 2, textAlign: 'right' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: Theme.primaryTint, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontSize: 12, color: Theme.primary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1, backgroundColor: Theme.surface, borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 4,
    shadowColor: Theme.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 28, fontWeight: '700', color: Theme.primary },
  statLabel: { fontSize: 12, color: Theme.textFaint },
  logoutButton: {
    backgroundColor: Theme.dangerBg, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  logoutText: { color: Theme.danger, fontWeight: '700', fontSize: 15 },
  infoBox: {
    backgroundColor: Theme.primaryTint, borderRadius: 12, padding: 12, gap: 4,
    borderLeftWidth: 3, borderLeftColor: Theme.primary,
  },
  infoBoxTitle: { fontSize: 13, fontWeight: '700', color: Theme.primary },
  infoBoxText: { fontSize: 12, color: Theme.primarySoft },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(12, 30, 60, 0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: Theme.cream, borderRadius: 18, padding: 20, width: '100%', maxWidth: 360, gap: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Theme.text, textAlign: 'center' },
  modalInput: {
    borderWidth: 1, borderColor: Theme.primaryBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: Theme.surface,
  },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalButton: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: Theme.creamDark },
  modalButtonCancelText: { color: Theme.text, fontWeight: '700' },
  modalButtonSave: { backgroundColor: Theme.primary },
  modalButtonSaveText: { color: Theme.onPrimary, fontWeight: '700' },
});
