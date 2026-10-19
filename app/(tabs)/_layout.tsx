import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Theme } from '../../constants/Colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Theme.primary,
        tabBarInactiveTintColor: Theme.textFaint,
        tabBarStyle: {
          backgroundColor: Theme.cream,
          borderTopWidth: 1,
          borderTopColor: Theme.creamBorder,
        },
        // หัวข้อบน (header) ทุกแท็บ = พื้นกรม ตัวอักษรครีม
        headerStyle: { backgroundColor: Theme.primary },
        headerTintColor: Theme.cream,
        headerTitleStyle: { fontWeight: '700' },
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'กิจกรรม',
          tabBarLabel: 'กิจกรรม',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'รายการโปรด',
          tabBarLabel: 'โปรด',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'สร้างกิจกรรม',
          tabBarLabel: 'สร้าง',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'โปรไฟล์',
          tabBarLabel: 'โปรไฟล์',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
