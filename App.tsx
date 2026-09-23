import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { FavoritesProvider } from './src/contexts/FavoritesContext';

import MapGuideScreen from './src/screens/MapGuideScreen';
import CameraScreen from './src/screens/CameraScreen';
import PokemonScreen from './src/screens/PokemonScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EventsScreen from './src/screens/EventsScreen';
import { setupNotificationChannelAsync } from './src/services/NotificationService';

type TabKey = 'map' | 'events' | 'camera' | 'pokemon' | 'profile';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabKey>('map');
  const [targetEventId, setTargetEventId] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // 1. ตั้งค่า Notification Channel สำหรับ Android
    setupNotificationChannelAsync();

    // 2. จัดการ Deep Link เมื่อผู้ใช้แตะที่ Notification (ทั้ง Foreground, Background, Cold Start)
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && data.eventId) {
        setTargetEventId(data.eventId as string);
        setCurrentTab('events'); // สลับไปยังแท็บกิจกรรมทันที
      }
    });

    // 3. ตรวจสอบสถานะ AppState (ตามเนื้อหา Week 11)
    const appStateSub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to foreground!');
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      appStateSub.remove();
    };
  }, []);

  const renderScreen = () => {
    switch (currentTab) {
      case 'map':
        return <MapGuideScreen onCheckInWithCamera={() => setCurrentTab('camera')} />;
      case 'events':
        return (
          <EventsScreen
            onOpenMapPlace={() => setCurrentTab('map')}
            externalSelectedEventId={targetEventId}
            onClearExternalSelectedEvent={() => setTargetEventId(null)}
          />
        );
      case 'camera':
        return <CameraScreen />;
      case 'pokemon':
        return <PokemonScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <MapGuideScreen />;
    }
  };

  const isDarkModeTab = currentTab === 'pokemon' || currentTab === 'camera';

  return (
    <FavoritesProvider>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDarkModeTab ? '#0B1929' : '#F7F1E7' },
        ]}
      >
        <StatusBar style={isDarkModeTab ? 'light' : 'dark'} />

        {/* Active Screen */}
        <View style={styles.screenContainer}>{renderScreen()}</View>

        {/* Global Bottom Tab Bar (5 Tabs) */}
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: isDarkModeTab ? '#0F1F3D' : '#FFFFFF',
              borderTopColor: isDarkModeTab ? 'rgba(255,255,255,0.08)' : '#E8D9C9',
            },
          ]}
        >
          {/* Tab 1: Map Guide */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setCurrentTab('map')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={currentTab === 'map' ? 'map' : 'map-outline'}
              size={22}
              color={currentTab === 'map' ? '#B75B3E' : isDarkModeTab ? '#8B9BB4' : '#7B6F65'}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    currentTab === 'map'
                      ? '#B75B3E'
                      : isDarkModeTab
                      ? '#8B9BB4'
                      : '#7B6F65',
                  fontWeight: currentTab === 'map' ? '700' : '500',
                },
              ]}
            >
              แผนที่
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Events & Reminder (Week 11 Lab) */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setCurrentTab('events')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={currentTab === 'events' ? 'bell' : 'bell-outline'}
              size={22}
              color={currentTab === 'events' ? '#B75B3E' : isDarkModeTab ? '#8B9BB4' : '#7B6F65'}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    currentTab === 'events'
                      ? '#B75B3E'
                      : isDarkModeTab
                      ? '#8B9BB4'
                      : '#7B6F65',
                  fontWeight: currentTab === 'events' ? '700' : '500',
                },
              ]}
            >
              กิจกรรม
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Camera */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setCurrentTab('camera')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentTab === 'camera' ? 'camera' : 'camera-outline'}
              size={22}
              color={currentTab === 'camera' ? '#FF6B43' : isDarkModeTab ? '#8B9BB4' : '#7B6F65'}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    currentTab === 'camera'
                      ? '#FF6B43'
                      : isDarkModeTab
                      ? '#8B9BB4'
                      : '#7B6F65',
                  fontWeight: currentTab === 'camera' ? '700' : '500',
                },
              ]}
            >
              กล้อง
            </Text>
          </TouchableOpacity>

          {/* Tab 4: Pokemon */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setCurrentTab('pokemon')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="pokeball"
              size={22}
              color={currentTab === 'pokemon' ? '#FFCB05' : isDarkModeTab ? '#8B9BB4' : '#7B6F65'}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    currentTab === 'pokemon'
                      ? '#FFCB05'
                      : isDarkModeTab
                      ? '#8B9BB4'
                      : '#7B6F65',
                  fontWeight: currentTab === 'pokemon' ? '700' : '500',
                },
              ]}
            >
              Pokédex
            </Text>
          </TouchableOpacity>

          {/* Tab 5: Profile */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setCurrentTab('profile')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentTab === 'profile' ? 'person' : 'person-outline'}
              size={21}
              color={currentTab === 'profile' ? '#B75B3E' : isDarkModeTab ? '#8B9BB4' : '#7B6F65'}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    currentTab === 'profile'
                      ? '#B75B3E'
                      : isDarkModeTab
                      ? '#8B9BB4'
                      : '#7B6F65',
                  fontWeight: currentTab === 'profile' ? '700' : '500',
                },
              ]}
            >
              ผู้พัฒนา
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </FavoritesProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 58,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 10 : 4,
    paddingTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});
