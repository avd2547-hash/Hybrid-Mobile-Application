import { useAuth } from '@/src/contexts/AuthContext';
import { Theme } from '../constants/Colors';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

// Week 8: Login/Register ด้วยชื่อ + รหัสผ่าน (mock auth + SecureStore)
type Mode = 'login' | 'register';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  const handleSwitchMode = useCallback(() => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setErrors({});
    setPassword('');
    setConfirmPassword('');
  }, []);

  const validate = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'กรุณากรอกชื่อ';
    if (password.length < 4) errs.password = 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร';
    if (isRegister && confirmPassword !== password) {
      errs.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }
    return errs;
  }, [name, password, confirmPassword, isRegister]);

  const handleSubmit = useCallback(async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      if (isRegister) {
        await register(name, password);
        Alert.alert('สมัครสมาชิกสำเร็จ!', `ยินดีต้อนรับ ${name.trim()}`);
      } else {
        await login(name, password);
      }
      // Stack.Protected จะ redirect อัตโนมัติ
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'invalid-credentials') {
        setErrors({ password: 'ชื่อหรือรหัสผ่านไม่ถูกต้อง' });
      } else if (code === 'name-taken') {
        setErrors({ name: 'ชื่อนี้ถูกใช้แล้ว กรุณาใช้ชื่ออื่นหรือเข้าสู่ระบบ' });
      } else {
        setErrors({ password: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
      }
    } finally {
      setLoading(false);
    }
  }, [name, password, isRegister, validate, login, register]);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🎓</Text>
            <Text style={styles.appName}>Campus Events</Text>
            <Text style={styles.subtitle}>
              {isRegister ? 'สมัครสมาชิกด้วยชื่อและรหัสผ่าน' : 'เข้าสู่ระบบเพื่อใช้งาน'}
            </Text>
          </View>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>ชื่อผู้ใช้</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="เช่น สมชาย ใจดี"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              accessibilityLabel="ชื่อผู้ใช้"
              returnKeyType="next"
            />
            {errors.name ? (
              <Text style={styles.errorText} accessibilityLiveRegion="assertive">
                {errors.name}
              </Text>
            ) : null}
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>รหัสผ่าน</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              accessibilityLabel="รหัสผ่าน"
              returnKeyType={isRegister ? 'next' : 'done'}
              onSubmitEditing={!isRegister ? handleSubmit : undefined}
            />
            {errors.password ? (
              <Text style={styles.errorText} accessibilityLiveRegion="assertive">
                {errors.password}
              </Text>
            ) : null}
          </View>

          {/* Confirm password (register only) */}
          {isRegister && (
            <View style={styles.field}>
              <Text style={styles.label}>ยืนยันรหัสผ่าน</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                accessibilityLabel="ยืนยันรหัสผ่าน"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              {errors.confirmPassword ? (
                <Text style={styles.errorText} accessibilityLiveRegion="assertive">
                  {errors.confirmPassword}
                </Text>
              ) : null}
            </View>
          )}

          {/* Submit */}
          <Pressable
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={
              loading
                ? 'กำลังดำเนินการ...'
                : isRegister
                  ? 'สมัครสมาชิก'
                  : 'เข้าสู่ระบบ'
            }
          >
            <Text style={styles.loginText}>
              {loading
                ? 'กำลังดำเนินการ...'
                : isRegister
                  ? 'สมัครสมาชิก'
                  : 'เข้าสู่ระบบ'}
            </Text>
          </Pressable>

          {/* Switch login <-> register */}
          <Pressable onPress={handleSwitchMode} accessibilityRole="button">
            <Text style={styles.switchText}>
              {isRegister
                ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ'
                : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Theme.cream },
  scroll: { padding: 24, gap: 16, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', gap: 8, marginBottom: 8 },
  logo: { fontSize: 56 },
  appName: { fontSize: 28, fontWeight: '700', color: Theme.primary },
  subtitle: { fontSize: 14, color: Theme.textMuted, textAlign: 'center' },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: Theme.text },
  input: {
    backgroundColor: Theme.surface, borderWidth: 1, borderColor: Theme.creamBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Theme.text,
  },
  inputError: { borderColor: Theme.danger },
  errorText: { fontSize: 12, color: Theme.danger, fontWeight: '600' },
  loginButton: {
    backgroundColor: Theme.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  loginButtonDisabled: { backgroundColor: Theme.primaryBorder },
  loginText: { color: Theme.onPrimary, fontWeight: '700', fontSize: 16 },
  switchText: { textAlign: 'center', color: Theme.primarySoft, fontWeight: '600', fontSize: 14, paddingVertical: 8 },
});
