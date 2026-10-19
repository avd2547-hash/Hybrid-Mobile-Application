/**
 * ธีมกลางของแอป Campus Events (สัปดาห์ 3: Styling)
 * โทนเดียวทั้งแอป: น้ำเงินกรม = สีหลัก · ครีม = สีรอง (พื้นหลัง)
 * สถานะที่นั่ง: ปกติ = เขียว · ใกล้เต็ม = ชมพู
 */
export const Theme = {
  // สีหลัก — น้ำเงินกรม
  primary: '#16305A',
  primaryDark: '#0C1E3C',
  primarySoft: '#2A4D82',
  primaryTint: '#E7EDF7', // กรมอ่อน (ชิป/แท็ก บนพื้นครีม)
  primaryBorder: '#C2D1E8',
  onPrimary: '#FFFFFF',

  // สีรอง — ครีม
  cream: '#FBF5E6', // พื้นหลังหลักของทุกหน้า
  creamDark: '#F3E8D2', // พื้น input ทั่วไป/placeholder พื้นที่
  creamBorder: '#E7DCC4',

  // พื้นผิว/ตัวอักษร
  surface: '#FFFFFF',
  text: '#16233A',
  textMuted: '#5A6B85',
  textFaint: '#8B9AB3',

  // สถานะ
  success: '#1F8A4C',
  successBg: '#DFF3E4',
  successText: '#14653A',
  danger: '#B4344F',
  dangerBg: '#FCE4EC',
  dangerText: '#9D174D',
  warningBg: '#FDF3E0',
  warningBorder: '#E9C77A',
  warningText: '#92400E',
  accent: '#C9A227', // ทอง (ดาวรายการโปรด)
  shadow: '#0C1E3C',
} as const;

/** สถานะที่นั่งของกิจกรรม — ใช้ร่วมกันทุกหน้า */
export type SeatStatus = 'available' | 'nearly-full' | 'full';

export function getSeatStatus(spotsLeft: number, capacity: number): SeatStatus {
  if (spotsLeft <= 0) return 'full';
  // "ใกล้เต็ม" = เหลือ ≤ 20% ของความจุ (และอย่างน้อย 5 ที่สุดท้าย)
  if (spotsLeft <= Math.max(5, Math.ceil(capacity * 0.2))) return 'nearly-full';
  return 'available';
}

/** สีของ badge ที่นั่งตามสถานะ */
export const SEAT_COLORS: Record<SeatStatus, { bg: string; text: string }> = {
  available: { bg: Theme.successBg, text: Theme.successText }, // ปกติ = เขียว
  'nearly-full': { bg: Theme.dangerBg, text: Theme.dangerText }, // ใกล้เต็ม = ชมพู
  full: { bg: Theme.dangerBg, text: Theme.dangerText },
};

// เก็บรูปแบบเดิม (useColorScheme) ไว้เพื่อความเข้ากันได้
const tintColorLight = Theme.primary;
const tintColorDark = Theme.cream;

export default {
  light: {
    text: Theme.text,
    background: Theme.cream,
    tint: tintColorLight,
    tabIconDefault: Theme.textFaint,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: Theme.cream,
    background: Theme.primaryDark,
    tint: tintColorDark,
    tabIconDefault: '#CCC',
    tabIconSelected: tintColorDark,
  },
};
