import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/Colors';
import { RouteStep, formatDuration } from '../services/routing';

// ลิสต์คำแนะนำ turn-by-turn ภาษาไทย (เลี้ยวซ้าย/เลี้ยวขวา) ใต้แผนที่
type RouteStepsProps = {
  steps: RouteStep[];
  /** ระยะทางรวมตามถนน (เมตร) */
  distanceMeters: number;
  /** เวลาโดยสารโดยประมาณ (วินาที) */
  durationSeconds: number;
  /** แสดงทั้งหมดหรือย่อ (ค่าเริ่มต้นย่อเหลือ 3 รายการแรก) */
  expanded: boolean;
  onToggleExpanded: () => void;
};

export function RouteSteps({
  steps,
  distanceMeters,
  durationSeconds,
  expanded,
  onToggleExpanded,
}: RouteStepsProps) {
  const visible = expanded ? steps : steps.slice(0, 3);
  const km = distanceMeters / 1000;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        🧭 เส้นทางขับรถ {km < 1 ? `${Math.round(km * 1000)} ม.` : `${km.toFixed(1)} กม.`} · ≈ {formatDuration(durationSeconds)}
      </Text>

      <View style={styles.list}>
        {visible.map((step, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.icon}>{step.icon}</Text>
            <View style={styles.textContent}>
              <Text style={styles.instruction}>{step.instruction}</Text>
              {step.roadName ? (
                <Text style={styles.road}>ถนน: {step.roadName}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {steps.length > 3 && (
        <Pressable
          onPress={onToggleExpanded}
          style={styles.toggle}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'ย่อคำแนะนำเส้นทาง' : 'ดูคำแนะนำเส้นทางทั้งหมด'}
        >
          <Text style={styles.toggleText}>
            {expanded ? '▲ ย่อ' : `▼ ดูทั้งหมด ${steps.length} ขั้นตอน`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.creamBorder,
    padding: 14,
    gap: 10,
  },
  header: { fontSize: 14, fontWeight: '700', color: Theme.text },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  icon: { fontSize: 18, lineHeight: 24 },
  textContent: { flex: 1, gap: 1 },
  instruction: { fontSize: 13, color: Theme.text, lineHeight: 19 },
  road: { fontSize: 11, color: Theme.textFaint },
  toggle: { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 12 },
  toggleText: { fontSize: 12, fontWeight: '600', color: Theme.primarySoft },
});
