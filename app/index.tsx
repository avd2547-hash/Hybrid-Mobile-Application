import { useAuth } from '@/src/contexts/AuthContext';
import { Theme } from '../constants/Colors';
import { Redirect, useRootNavigationState } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

// Week 4: Root route — redirect ตาม session state
// ⚠️ ต้องรอ root navigation พร้อมก่อน redirect ไม่งั้นบนมือถือ
//    Stack.Protected ยังไม่ mount ทำให้ redirect ล้มเหลวและ spinner ค้าง
export default function IndexRedirect() {
  const { session } = useAuth();
  const rootNavigationState = useRootNavigationState();

  // ยังโหลดอยู่ (session restore หรือ navigator ยังไม่พร้อม)
  if (!rootNavigationState?.key || session.status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.cream }}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  const target = session.status === 'authenticated' ? '/events' : '/login';
  return <Redirect href={target} />;
}
