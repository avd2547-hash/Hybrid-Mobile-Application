import { registerForEvent } from '@/src/services/api';
import { useAuth } from '@/src/contexts/AuthContext';
import { Theme } from '../../constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
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

// Week 5: Controlled form + validation + no duplicate submit
type RegistrationForm = {
  fullName: string;
  email: string;
  studentId: string;
};

type FormErrors = Partial<Record<keyof RegistrationForm, string>>;

function validate(form: RegistrationForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.fullName.trim()) errors.fullName = 'กรุณากรอกชื่อ-นามสกุล';
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'อีเมลไม่ถูกต้อง';
  if (!form.studentId.trim()) errors.studentId = 'กรุณากรอกรหัสนักศึกษา';
  return errors;
}

export default function RegisterScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const eventId = Array.isArray(id) ? id[0] : id;
  const { session } = useAuth();
  const account = session.status === 'authenticated' ? session.accountKey : 'guest';

  const [form, setForm] = useState<RegistrationForm>({ fullName: '', email: '', studentId: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<keyof RegistrationForm>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Week 6: abort request ค้างเมื่อออกจากหน้า
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const updateField = useCallback(<K extends keyof RegistrationForm>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => new Set(prev).add(key));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!eventId) return;
    const newErrors = validate(form);
    setErrors(newErrors);
    setTouched(new Set(['fullName', 'email', 'studentId']));
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true); // Week 5: ป้องกัน double submit
    try {
      const controller = new AbortController();
      abortRef.current = controller;
      // บันทึกการเข้าร่วมในชื่อบัญชีที่ล็อกอินอยู่ (เลิกได้ภายหลังจากหน้ารายละเอียด)
      await registerForEvent(account, eventId, form, controller.signal);
      Alert.alert('ลงทะเบียนสำเร็จ! 🎉', 'เราได้รับการลงทะเบียนของคุณแล้ว', [
        { text: 'ตกลง', onPress: () => router.back() },
      ]);
    } catch {
      // Week 6: ไม่ล้างฟอร์มเมื่อเกิดข้อผิดพลาด
      Alert.alert('ลงทะเบียนไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  }, [eventId, form, account]);

  const displayErrors: FormErrors = {};
  for (const key of Object.keys(form) as (keyof RegistrationForm)[]) {
    if (touched.has(key)) displayErrors[key] = errors[key];
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>กรอกข้อมูลลงทะเบียน</Text>

          <Field label="ชื่อ-นามสกุล *" error={displayErrors.fullName}>
            <TextInput
              style={[styles.input, displayErrors.fullName && styles.inputError]}
              placeholder="เช่น สมชาย ใจดี"
              value={form.fullName}
              onChangeText={(v) => updateField('fullName', v)}
              accessibilityLabel="ชื่อ-นามสกุล"
              autoCapitalize="words"
              returnKeyType="next"
            />
          </Field>

          <Field label="อีเมล *" error={displayErrors.email}>
            <TextInput
              style={[styles.input, displayErrors.email && styles.inputError]}
              placeholder="example@kku.ac.th"
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="อีเมล"
              returnKeyType="next"
            />
          </Field>

          <Field label="รหัสนักศึกษา *" error={displayErrors.studentId}>
            <TextInput
              style={[styles.input, displayErrors.studentId && styles.inputError]}
              placeholder="เช่น 663450001-1"
              value={form.studentId}
              onChangeText={(v) => updateField('studentId', v)}
              keyboardType="numbers-and-punctuation"
              accessibilityLabel="รหัสนักศึกษา"
              returnKeyType="done"
            />
          </Field>

          <Pressable
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={submitting ? 'กำลังลงทะเบียน...' : 'ยืนยันการลงทะเบียน'}
          >
            <Text style={styles.submitText}>
              {submitting ? 'กำลังลงทะเบียน...' : 'ยืนยันการลงทะเบียน'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? (
        <Text style={styles.errorText} accessibilityLiveRegion="assertive">{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Theme.cream },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '700', color: Theme.primary, marginBottom: 4 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: Theme.text },
  input: {
    backgroundColor: Theme.surface,
    borderWidth: 1, borderColor: Theme.creamBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Theme.text,
  },
  inputError: { borderColor: Theme.danger },
  errorText: { fontSize: 12, color: Theme.danger, fontWeight: '600' },
  submitButton: { backgroundColor: Theme.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitButtonDisabled: { backgroundColor: Theme.primaryBorder },
  submitText: { color: Theme.onPrimary, fontWeight: '700', fontSize: 16 },
});
