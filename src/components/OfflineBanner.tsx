import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/Colors';

type OfflineBannerProps = {
  updatedAt: string | null;
};

export function OfflineBanner({ updatedAt }: OfflineBannerProps) {
  const timeStr = updatedAt
    ? new Date(updatedAt).toLocaleString('th-TH', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <View
      style={styles.banner}
      accessibilityLiveRegion="assertive"
      accessibilityLabel={`ไม่มีการเชื่อมต่ออินเทอร์เน็ต${timeStr ? ` ข้อมูลล่าสุดเมื่อ ${timeStr}` : ''}`}
    >
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.text}>
        ออฟไลน์ — แสดงข้อมูลจาก cache
        {timeStr ? `\nอัปเดตล่าสุด: ${timeStr}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.warningBg,
    borderBottomWidth: 1,
    borderColor: Theme.warningBorder,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  icon: { fontSize: 16 },
  text: { fontSize: 12, color: Theme.warningText, flexShrink: 1 },
});
