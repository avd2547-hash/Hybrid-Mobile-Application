import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/Colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'ไม่พบหน้านี้' }} />
      <View style={styles.container}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={styles.title}>ไม่พบหน้าที่คุณต้องการ</Text>
        <Text style={styles.subtitle}>เส้นทางนี้ไม่มีอยู่ในแอป</Text>
        <Link href="/" asChild>
          <Pressable style={styles.button} accessibilityRole="button" accessibilityLabel="กลับหน้าหลัก">
            <Text style={styles.buttonText}>กลับหน้าหลัก</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: Theme.cream },
  icon: { fontSize: 56 },
  title: { fontSize: 20, fontWeight: '700', color: Theme.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Theme.textMuted, textAlign: 'center' },
  button: { backgroundColor: Theme.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  buttonText: { color: Theme.onPrimary, fontWeight: '700', fontSize: 15 },
});
