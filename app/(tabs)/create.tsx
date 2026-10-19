import { useAuth } from '@/src/contexts/AuthContext';
import { createEvent } from '@/src/services/api';
import {
  extractCoordsFromMapsUrl,
  resolveShortMapsUrl,
} from '@/src/services/maps-link';
import DateTimePickerField from '@/src/components/DateTimePickerField';
import { CampusEvent } from '@/src/types/event';
import { Theme } from '../../constants/Colors';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Week 5: Controlled form + validation
type CreateEventForm = {
  title: string;
  description: string;
  locationName: string;
  mapsUrl: string;
  category: CampusEvent['category'];
  capacity: string;
  startsAt: Date | null; // วันเวลาที่กิจกรรมจะจัดขึ้น (เลือกจาก picker)
};

type FormErrors = Partial<Record<keyof CreateEventForm, string>>;

const CATEGORIES: CampusEvent['category'][] = [
  'Academic', 'Workshop', 'Sports', 'Cultural', 'Career',
];

function validate(form: CreateEventForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim()) errors.title = 'กรุณากรอกชื่อกิจกรรม';
  if (!form.description.trim()) errors.description = 'กรุณากรอกรายละเอียด';
  if (!form.locationName.trim()) errors.locationName = 'กรุณากรอกสถานที่';
  const cap = Number(form.capacity);
  if (!form.capacity || isNaN(cap) || cap < 1) errors.capacity = 'จำนวนผู้เข้าร่วมต้องมากกว่า 0';
  // วันเวลาเริ่มกิจกรรม — ต้องเลือก และต้องเป็นอนาคต (ไม่งั้นตั้งแจ้งเตือนล่วงหน้าไม่ได้)
  if (!form.startsAt) {
    errors.startsAt = 'กรุณาเลือกวันและเวลาที่กิจกรรมจะจัดขึ้น';
  } else if (form.startsAt.getTime() <= Date.now()) {
    errors.startsAt = 'วันเวลากิจกรรมต้องเป็นอนาคต';
  }
  // ลิงก์แผนที่ (ไม่บังคับ) — ถ้ากรอกต้องเป็นลิงก์ Google Maps ที่อ่านพิกัดได้
  if (form.mapsUrl.trim()) {
    const coords = extractCoordsFromMapsUrl(form.mapsUrl);
    if (!coords && !form.mapsUrl.includes('maps.app.goo.gl') && !form.mapsUrl.includes('goo.gl')) {
      errors.mapsUrl = 'ไม่พบพิกัดในลิงก์ — ใช้ปุ่ม Share → Copy link ใน Google Maps';
    }
  }
  return errors;
}

export default function CreateScreen() {
  const { session } = useAuth();
  const [form, setForm] = useState<CreateEventForm>({
    title: '',
    description: '',
    locationName: '',
    mapsUrl: '',
    category: 'Academic',
    capacity: '',
    startsAt: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<keyof CreateEventForm>>(new Set());
  const [draftImageUri, setDraftImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = useCallback(<K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => new Set(prev).add(key));
  }, []);

  // Week 9: Image Picker
  const handlePickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      if (!permission.canAskAgain) {
        Alert.alert(
          'ต้องการสิทธิ์เข้าถึงคลังภาพ',
          'กรุณาเปิดสิทธิ์ในการตั้งค่าของเครื่อง',
          [{ text: 'ตกลง' }],
        );
      }
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setDraftImageUri(result.assets[0].uri);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const newErrors = validate(form);
    setErrors(newErrors);
    // Mark all as touched
    setTouched(new Set(Object.keys(form) as (keyof CreateEventForm)[]));

    if (Object.keys(newErrors).length > 0 || !form.startsAt) return;

    setSubmitting(true);
    try {
      // เรียก API layer — บันทึกลง storage แล้วปรากฏในหน้ารายการทันที
      // ลิงก์สั้น (maps.app.goo.gl) ต้อง resolve พิกัดจาก redirect ก่อน
      let coords = extractCoordsFromMapsUrl(form.mapsUrl) ?? null;
      if (!coords && form.mapsUrl.trim()) {
        coords = await resolveShortMapsUrl(form.mapsUrl);
      }

      // บันทึกกิจกรรมในชื่อบัญชีที่ล็อกอินอยู่ (บัญชีของใครของมัน)
      const account =
        session.status === 'authenticated' ? session.accountKey : 'guest';
      await createEvent(account, {
        title: form.title,
        description: form.description,
        locationName: form.locationName,
        category: form.category,
        capacity: Number(form.capacity),
        startsAt: form.startsAt.toISOString(),
        imageUrl: draftImageUri ?? undefined,
        coords: coords ?? undefined,
      });
      Alert.alert(
        'สำเร็จ!',
        coords
          ? 'สร้างกิจกรรมเรียบร้อยแล้ว — หมุดแผนที่จะปักตามพิกัดจาก Google Maps'
          : 'สร้างกิจกรรมเรียบร้อยแล้ว (ไม่มีลิงก์แผนที่ — ใช้พิกัด default)',
        [{ text: 'ตกลง', onPress: () => router.back() }],
      );
    } catch {
      // Form state ยังคงอยู่เมื่อเกิดข้อผิดพลาด (Week 5)
      Alert.alert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  }, [form, draftImageUri, session]);

  const displayErrors: FormErrors = {};
  for (const key of Object.keys(form) as (keyof CreateEventForm)[]) {
    if (touched.has(key)) displayErrors[key] = errors[key];
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Image picker (Week 9) */}
          <Pressable style={styles.imagePicker} onPress={handlePickImage} accessibilityRole="button" accessibilityLabel="เลือกรูปภาพกิจกรรม">
            {draftImageUri ? (
              <View>
                <Image source={{ uri: draftImageUri }} style={styles.previewImage} />
                <Pressable style={styles.removeImage} onPress={() => setDraftImageUri(null)} accessibilityLabel="ลบรูปภาพ">
                  <Text style={styles.removeImageText}>✕</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Text style={styles.imagePickerIcon}>📷</Text>
                <Text style={styles.imagePickerText}>เพิ่มรูปภาพกิจกรรม</Text>
              </View>
            )}
          </Pressable>

          {/* Title */}
          <Field label="ชื่อกิจกรรม *" error={displayErrors.title}>
            <TextInput
              style={[styles.input, displayErrors.title && styles.inputError]}
              placeholder="เช่น Workshop: React Native"
              value={form.title}
              onChangeText={(v) => updateField('title', v)}
              accessibilityLabel="ชื่อกิจกรรม"
              returnKeyType="next"
            />
          </Field>

          {/* Description */}
          <Field label="รายละเอียด *" error={displayErrors.description}>
            <TextInput
              style={[styles.input, styles.textarea, displayErrors.description && styles.inputError]}
              placeholder="อธิบายกิจกรรม..."
              value={form.description}
              onChangeText={(v) => updateField('description', v)}
              multiline
              numberOfLines={4}
              accessibilityLabel="รายละเอียดกิจกรรม"
              textAlignVertical="top"
            />
          </Field>

          {/* Location */}
          <Field label="สถานที่ *" error={displayErrors.locationName}>
            <TextInput
              style={[styles.input, displayErrors.locationName && styles.inputError]}
              placeholder="เช่น ห้อง 101 อาคาร IT"
              value={form.locationName}
              onChangeText={(v) => updateField('locationName', v)}
              accessibilityLabel="สถานที่จัดกิจกรรม"
              returnKeyType="next"
            />
          </Field>

          {/* Google Maps link (ไม่บังคับ) */}
          <Field
            label="ลิงก์ Google Maps (ไม่บังคับ — เพื่อหมุดแผนที่ที่แม่นยำ)"
            error={displayErrors.mapsUrl}
          >
            <TextInput
              style={[styles.input, displayErrors.mapsUrl && styles.inputError]}
              placeholder="เช่น https://maps.app.goo.gl/... หรือ https://www.google.com/maps?q=16.47,102.82"
              value={form.mapsUrl}
              onChangeText={(v) => updateField('mapsUrl', v)}
              accessibilityLabel="ลิงก์ Google Maps"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="next"
            />
          </Field>

          {/* Category */}
          <Field label="ประเภทกิจกรรม">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.catChip, form.category === cat && styles.catChipActive]}
                  onPress={() => updateField('category', cat)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: form.category === cat }}
                >
                  <Text style={[styles.catChipText, form.category === cat && styles.catChipTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Field>

          {/* Starts at (วันเวลาเริ่มกิจกรรม — ใช้คำนวณเวลาแจ้งเตือน) */}
          <Field label="วันและเวลาที่กิจกรรมจะจัดขึ้น *" error={displayErrors.startsAt}>
            <DateTimePickerField
              value={form.startsAt}
              onChange={(d) => updateField('startsAt', d)}
              error={Boolean(displayErrors.startsAt)}
            />
          </Field>

          {/* Capacity */}
          <Field label="จำนวนผู้เข้าร่วม (คน) *" error={displayErrors.capacity}>
            <TextInput
              style={[styles.input, displayErrors.capacity && styles.inputError]}
              placeholder="เช่น 50"
              value={form.capacity}
              onChangeText={(v) => updateField('capacity', v)}
              keyboardType="number-pad"
              accessibilityLabel="จำนวนผู้เข้าร่วมสูงสุด"
              returnKeyType="done"
            />
          </Field>

          {/* Submit (Week 5: disabled when submitting) */}
          <Pressable
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={submitting ? 'กำลังสร้างกิจกรรม...' : 'สร้างกิจกรรม'}
          >
            <Text style={styles.submitText}>
              {submitting ? 'กำลังสร้าง...' : 'สร้างกิจกรรม'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Helper component
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? (
        <Text style={styles.errorText} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Theme.cream },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 40 },
  imagePicker: { borderRadius: 16, overflow: 'hidden', backgroundColor: Theme.creamDark, marginBottom: 4 },
  imagePickerPlaceholder: { height: 160, justifyContent: 'center', alignItems: 'center', gap: 8 },
  imagePickerIcon: { fontSize: 36 },
  imagePickerText: { color: Theme.primary, fontWeight: '600' },
  previewImage: { width: '100%', height: 200 },
  removeImage: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16, width: 32, height: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  removeImageText: { color: '#fff', fontWeight: '700' },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: Theme.text },
  input: {
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.creamBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Theme.text,
  },
  textarea: { minHeight: 100 },
  inputError: { borderColor: Theme.danger },
  errorText: { fontSize: 12, color: Theme.danger, fontWeight: '600' },
  catChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: Theme.surface, borderWidth: 1, borderColor: Theme.creamBorder,
  },
  catChipActive: { backgroundColor: Theme.primary, borderColor: Theme.primary },
  catChipText: { fontSize: 13, color: Theme.textMuted },
  catChipTextActive: { color: Theme.onPrimary, fontWeight: '700' },
  submitButton: {
    backgroundColor: Theme.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  submitButtonDisabled: { backgroundColor: Theme.primaryBorder },
  submitText: { color: Theme.onPrimary, fontWeight: '700', fontSize: 16 },
});
