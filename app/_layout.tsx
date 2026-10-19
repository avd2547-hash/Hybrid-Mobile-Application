import { AuthProvider } from '@/src/contexts/AuthContext';
import { FavoritesProvider } from '@/src/contexts/FavoritesContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { Theme } from '../constants/Colors';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

// ─── Notification Deep Link (Week 11) ────────────────────────────────────

function NotificationListener() {
  useEffect(() => {
    // Web: expo-notifications ไม่รองรับ listener บนเบราว์เซอร์ — ข้าม (Week 11 เป็น native feature)
    if (Platform.OS === 'web') return;

    // Cold start: อ่าน notification ที่ใช้เปิดแอป
    const initial = Notifications.getLastNotificationResponse();
    if (initial) {
      handleResponse(initial);
      Notifications.clearLastNotificationResponse();
    }

    // Foreground / Background response
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, []);

  return null;
}

function handleResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data;
  if (typeof data?.eventId === 'string') {
    router.push({ pathname: '/events/[id]', params: { id: data.eventId } });
  }
}

// ─── Protected Navigation (Week 8) ───────────────────────────────────────

function RootNavigator() {
  const { session } = useAuth();

  if (session.status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.cream }}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  const isAuthenticated = session.status === 'authenticated';

  return (
    <Stack
      screenOptions={{
        // ธีมหัวข้อ (header) ทุกหน้า: พื้นกรม ตัวอักษรครีม
        headerStyle: { backgroundColor: Theme.primary },
        headerTintColor: Theme.cream,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      {/* index redirect — จัดการ auth ในตัว (ดู app/index.tsx) */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Unauthenticated routes */}
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" options={{ title: 'เข้าสู่ระบบ', headerShown: false }} />
      </Stack.Protected>

      {/* Authenticated routes */}
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="events/[id]"
          options={{ title: 'รายละเอียดกิจกรรม', headerBackTitle: 'กลับ' }}
        />
        <Stack.Screen
          name="register/[id]"
          options={{ title: 'ลงทะเบียน', headerBackTitle: 'กลับ', presentation: 'modal' }}
        />
      </Stack.Protected>

      <Stack.Screen name="+not-found" options={{ title: 'ไม่พบหน้า' }} />
    </Stack>
  );
}

// ─── Root Layout ─────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <NotificationListener />
        <RootNavigator />
      </FavoritesProvider>
    </AuthProvider>
  );
}
