// เลือกวันและเวลาเริ่มกิจกรรม — ปฏิทินแบบสร้างเอง (pure RN ไม่พึ่ง native picker)
// 2 ขั้นตอน: ขั้นที่ 1 เลือกวันจากปฏิทิน → ขั้นที่ 2 กรอกเวลา (ชั่วโมง/นาที)
// ค่าที่เลือกจะกลายเป็น startsAt เพื่อให้ระบบแจ้งเตือนล่วงหน้าคำนวณเวลาได้ถูกต้อง
import { Theme } from '../../constants/Colors';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  value: Date | null;
  onChange: (date: Date) => void;
  error?: boolean;
};

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
// เดือนไทย + พ.ศ. (ค.ศ. + 543)
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** สร้างปฏิทินเดือนหนึ่ง: array ของ (วันที่ | null = ช่องว่าง) จัดเรียงตามคอลัมน์ อา-ส */
function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0 = อาทิตย์
  const dayCount = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= dayCount; d++) cells.push(d);
  return cells;
}

export default function DateTimePickerField({ value, onChange, error }: Props) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'date' | 'time'>('date');
  // เดือนที่กำลังดูในปฏิทิน
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? now.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(value);
  const [hours, setHours] = useState<string>(String(value?.getHours() ?? now.getHours()).padStart(2, '0'));
  const [minutes, setMinutes] = useState<string>(String(value?.getMinutes() ?? 0).padStart(2, '0'));
  const [timeError, setTimeError] = useState('');

  const [hoursBlurred, setHoursBlurred] = useState(true);
  const [minutesBlurred, setMinutesBlurred] = useState(true);

  const openPicker = () => {
    const base = value ?? now;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setSelectedDay(value);
    setStep('date');
    setTimeError('');
    setOpen(true);
  };

  const isPastDay = (y: number, m: number, d: number) =>
    new Date(y, m, d, 23, 59, 59).getTime() < now.getTime();

  const changeMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const pickDay = (d: number) => {
    if (isPastDay(viewYear, viewMonth, d)) return; // วันที่ผ่านมาแล้วเลือกไม่ได้
    setSelectedDay(new Date(viewYear, viewMonth, d));
  };

  const goTimeStep = () => {
    if (!selectedDay) {
      setTimeError('กรุณาเลือกวันที่ในปฏิทินก่อน');
      return;
    }
    setTimeError('');
    setStep('time');
  };

  /** ชั่วโมง: 0-23 / นาที: <5 ต้องขึ้นต้น 0 เช่น 05 */
  const HOUR_RE = /^([01]?\d|2[0-3])$/;
  const MINUTE_RE = /^([0-5]?\d)$/;

  const confirm = () => {
    if (!selectedDay) {
      setTimeError('กรุณาเลือกวันที่ในปฏิทินก่อน');
      setStep('date');
      return;
    }
    const h = Number(hours);
    const mi = Number(minutes);
    if (!HOUR_RE.test(hours.trim()) || !MINUTE_RE.test(minutes.trim())) {
      setTimeError('กรุณากรอกเวลาให้ถูกต้อง เช่น 14 และ 30');
      return;
    }
    const merged = new Date(
      selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(),
      h, mi, 0, 0,
    );
    if (merged.getTime() <= Date.now()) {
      setTimeError('วันเวลากิจกรรมต้องเป็นอนาคต');
      return;
    }
    onChange(merged);
    setOpen(false);
  };

  const display = value
    ? `${value.toLocaleDateString('th-TH', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })} • ${pad(value.getHours())}:${pad(value.getMinutes())} น.`
    : 'เลือกวันและเวลาที่กิจกรรมจะจัดขึ้น';

  const grid = buildMonthGrid(viewYear, viewMonth);
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  return (
    <View>
      <Pressable
        style={[styles.fieldButton, error && styles.fieldButtonError]}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel="วันและเวลาเริ่มกิจกรรม"
      >
        <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]}>{display}</Text>
        <Text style={styles.fieldIcon}>📅</Text>
      </Pressable>

      {open && (
        <View style={styles.sheet}>
          {step === 'date' && (
            <>
              {/* หัวปฏิทิน + ปุ่มเลื่อนเดือน */}
              <View style={styles.sheetHeader}>
                <Pressable
                  onPress={() => changeMonth(-1)}
                  style={styles.monthButton}
                  accessibilityRole="button"
                  accessibilityLabel="เดือนก่อนหน้า"
                >
                  <Text style={styles.monthButtonText}>‹</Text>
                </Pressable>
                <Text style={styles.monthTitle}>
                  {THAI_MONTHS[viewMonth]} {viewYear + 543}
                </Text>
                <Pressable
                  onPress={() => changeMonth(1)}
                  style={styles.monthButton}
                  accessibilityRole="button"
                  accessibilityLabel="เดือนถัดไป"
                >
                  <Text style={styles.monthButtonText}>›</Text>
                </Pressable>
              </View>

              {/* หัววันในสัปดาห์ */}
              <View style={styles.weekRow}>
                {WEEKDAYS.map((w, i) => (
                  <Text key={i} style={[styles.weekCell, (i === 0) && styles.weekendText]}>
                    {w}
                  </Text>
                ))}
              </View>

              {/* กริดวันที่ */}
              <View style={styles.grid}>
                {grid.map((d, i) => {
                  if (d === null) return <View key={`empty-${i}`} style={styles.dayCellEmpty} />;
                  const past = isPastDay(viewYear, viewMonth, d);
                  const isToday = todayKey === `${viewYear}-${viewMonth}-${d}`;
                  const isSelected =
                    selectedDay !== null &&
                    selectedDay.getFullYear() === viewYear &&
                    selectedDay.getMonth() === viewMonth &&
                    selectedDay.getDate() === d;
                  return (
                    <Pressable
                      key={d}
                      style={[
                        styles.dayCell,
                        isToday && styles.dayCellToday,
                        isSelected ? styles.dayCellSelected : null,
                        past && styles.dayCellPast,
                      ]}
                      onPress={() => pickDay(d)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`วันที่ ${d} ${THAI_MONTHS[viewMonth]} ${viewYear + 543}${past ? ' (ผ่านมาแล้ว)' : ''}`}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                          past && styles.dayTextPast,
                        ]}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {timeError ? <Text style={styles.stepError}>{timeError}</Text> : null}

              {/* ปุ่มไปเลือกเวลา */}
              <View style={styles.sheetActions}>
                <Pressable style={styles.secondaryButton} onPress={() => setOpen(false)}
                  accessibilityRole="button" accessibilityLabel="ยกเลิก">
                  <Text style={styles.secondaryButtonText}>ยกเลิก</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryButton, !selectedDay && styles.primaryButtonDisabled]}
                  onPress={goTimeStep}
                  accessibilityRole="button"
                  accessibilityLabel="ถัดไป เลือกเวลา"
                >
                  <Text style={styles.primaryButtonText}>ถัดไป → เลือกเวลา</Text>
                </Pressable>
              </View>
            </>
          )}

          {step === 'time' && (
            <>
              {/* สรุปวันที่ที่เลือก */}
              <Text style={styles.selectedDaySummary}>
                📅 {selectedDay!.toLocaleDateString('th-TH', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>

              <Text style={styles.timeLabel}>เวลาที่กิจกรรมจะเริ่ม (ชั่วโมง:นาที)</Text>

              {/* เวลาด่วน: ชิปเลือกเวลาตั้งต้น */}
              <View style={styles.quickTimes}>
                {[
                  { h: 9, m: 0, label: '09:00' },
                  { h: 10, m: 30, label: '10:30' },
                  { h: 13, m: 0, label: '13:00' },
                  { h: 15, m: 30, label: '15:30' },
                  { h: 18, m: 0, label: '18:00' },
                ].map((t) => {
                  const isCurrent =
                    selectedDay &&
                    Number(hours) === t.h && Number(minutes) === t.m;
                  return (
                    <Pressable
                      key={t.label}
                      style={[
                        styles.quickChip,
                        isCurrent ? styles.quickChipActive : null,
                      ]}
                      onPress={() => {
                        setHours(pad(t.h));
                        setMinutes(pad(t.m));
                        setTimeError('');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`เวลา ${t.label}`}
                    >
                      <Text style={isCurrent ? styles.quickChipTextActive : styles.quickChipText}>
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* ช่องกรอกชั่วโมง / นาที — พิมพ์เลขเองได้ (keyboard ตัวเลข) */}
              <View style={styles.timeRow}>
                <TextInput
                  style={[styles.timeInput, !hoursBlurred && styles.timeInputFocused]}
                  value={hours}
                  onChangeText={(v) => {
                    setHours(v.replace(/[^0-9]/g, '').slice(0, 2));
                    setTimeError('');
                  }}
                  onFocus={() => setHoursBlurred(false)}
                  onEndEditing={() => {
                    setHoursBlurred(true);
                    const n = Number(hours);
                    setHours(pad(isNaN(n) ? 0 : Math.min(23, Math.max(0, n))));
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  textAlign="center"
                  accessibilityLabel="ชั่วโมง เช่น 14"
                  selectTextOnFocus
                />
                <Text style={styles.timeColon}>:</Text>
                <TextInput
                  style={[styles.timeInput, !minutesBlurred && styles.timeInputFocused]}
                  value={minutes}
                  onChangeText={(v) => {
                    setMinutes(v.replace(/[^0-9]/g, '').slice(0, 2));
                    setTimeError('');
                  }}
                  onFocus={() => setMinutesBlurred(false)}
                  onEndEditing={() => {
                    setMinutesBlurred(true);
                    const n = Number(minutes);
                    setMinutes(pad(isNaN(n) ? 0 : Math.min(59, Math.max(0, n))));
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  textAlign="center"
                  accessibilityLabel="นาที เช่น 30"
                  selectTextOnFocus
                />
              </View>

              {/* ปุ่มเพิ่ม/ลดชั่วโมง */}
              <View style={styles.stepButtons}>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setHours(pad(Math.max(0, Number(hours) - 1)))}
                  accessibilityRole="button"
                  accessibilityLabel="ลดชั่วโมง"
                >
                  <Text style={styles.stepperText}>− ชม.</Text>
                </Pressable>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setHours(pad(Math.min(23, Number(hours) + 1)))}
                  accessibilityRole="button"
                  accessibilityLabel="เพิ่มชั่วโมง"
                >
                  <Text style={styles.stepperText}>+ ชม.</Text>
                </Pressable>
              </View>
              {/* ปุ่มเพิ่ม/ลดนาที */}
              <View style={styles.stepButtons}>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => {
                    const next = (Number(minutes) - 15 + 60) % 60;
                    setMinutes(pad(next));
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="ลดนาที 15"
                >
                  <Text style={styles.stepperText}>− 15 น.</Text>
                </Pressable>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setMinutes(pad((Number(minutes) + 15) % 60))}
                  accessibilityRole="button"
                  accessibilityLabel="เพิ่มนาที 15"
                >
                  <Text style={styles.stepperText}>+ 15 น.</Text>
                </Pressable>
              </View>

              {timeError ? <Text style={styles.stepError}>{timeError}</Text> : null}

              <View style={styles.sheetActions}>
                <Pressable style={styles.secondaryButton} onPress={() => setStep('date')}
                  accessibilityRole="button" accessibilityLabel="ย้อนกลับไปเลือกวัน">
                  <Text style={styles.secondaryButtonText}>‹ ย้อนกลับ</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={confirm}
                  accessibilityRole="button" accessibilityLabel="ยืนยันวันเวลา">
                  <Text style={styles.primaryButtonText}>เสร็จสิ้น</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldButton: {
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.creamBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldButtonError: { borderColor: Theme.danger },
  fieldText: { fontSize: 15, color: Theme.text, flex: 1 },
  fieldPlaceholder: { color: Theme.textMuted },
  fieldIcon: { fontSize: 18, marginLeft: 8 },

  sheet: {
    marginTop: 8,
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.creamBorder,
    padding: 14,
    gap: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Theme.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthButtonText: { fontSize: 20, color: Theme.primary, fontWeight: '700' },
  monthTitle: { fontSize: 16, fontWeight: '700', color: Theme.text },
  weekRow: { flexDirection: 'row' },
  weekCell: { flex: 1, textAlign: 'center', fontSize: 12, color: Theme.textMuted, fontWeight: '700' },
  weekendText: { color: Theme.danger },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCellEmpty: { width: `${100 / 7}%` },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  dayCellToday: { backgroundColor: Theme.creamDark },
  dayCellSelected: { backgroundColor: Theme.primary },
  dayCellPast: { opacity: 0.35 },
  dayText: { fontSize: 14, color: Theme.text },
  dayTextSelected: { color: Theme.onPrimary, fontWeight: '800' },
  dayTextPast: { color: Theme.textMuted },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  secondaryButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Theme.creamDark,
  },
  secondaryButtonText: { color: Theme.textMuted, fontWeight: '600' },
  primaryButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Theme.primary,
  },
  primaryButtonDisabled: { opacity: 0.4 },
  primaryButtonText: { color: Theme.onPrimary, fontWeight: '700' },

  selectedDaySummary: { fontSize: 14, fontWeight: '700', color: Theme.text },
  timeLabel: { fontSize: 13, color: Theme.textMuted },
  quickTimes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Theme.creamDark,
    borderWidth: 1,
    borderColor: Theme.creamBorder,
  },
  quickChipActive: { backgroundColor: Theme.primary, borderColor: Theme.primary },
  quickChipText: { color: Theme.textMuted, fontWeight: '600' },
  quickChipTextActive: { color: Theme.onPrimary, fontWeight: '700' },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  timeInput: {
    fontSize: 40,
    fontWeight: '800',
    color: Theme.text,
    minWidth: 80,
    textAlign: 'center',
    backgroundColor: Theme.creamDark,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  timeInputFocused: { borderColor: Theme.primary, borderWidth: 2 },
  timeColon: { fontSize: 36, fontWeight: '700', color: Theme.textMuted },
  stepButtons: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  stepperButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Theme.creamDark,
  },
  stepperText: { color: Theme.primary, fontWeight: '700', fontSize: 13 },
  stepError: { fontSize: 12, color: Theme.danger, fontWeight: '600' },
});
