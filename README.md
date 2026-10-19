# Campus Events Mobile 🎓

แอปพลิเคชัน **Campus Events** สำหรับดูและลงทะเบียนกิจกรรมในมหาวิทยาลัย พัฒนาด้วย React Native + Expo ครอบคลุมเนื้อหาสัปดาห์ 1–11

---

## 📦 Versions (Package Baseline)

| รายการ | เวอร์ชัน |
|---|---|
| expo | ~57.0.26 |
| expo-router | ~57.0.24 |
| react-native | 0.86.3 |
| react | 19.2.3 |
| typescript | ~6.0.3 |
| Node.js (แนะนำ) | 22 LTS |

---

## 🚀 วิธีเริ่มโปรเจกต์

### Prerequisites
- Node.js LTS (v22+)
- Git
- Android Studio (Android Emulator) หรืออุปกรณ์จริงที่ติดตั้ง **Expo Go**

### ขั้นตอน

```bash
# 1. Clone repo
git clone <YOUR_REPO_URL>
cd Hybrid-Mobile-Application

# 2. ติดตั้ง dependencies
npm install

# 3. เริ่ม dev server
npx expo start
```

4. สแกน QR Code ด้วย **Expo Go** บนอุปกรณ์จริง หรือกด `a` เพื่อเปิด Android Emulator

---

## 📁 โครงสร้างโปรเจกต์

```text
/
├── app/
│   ├── _layout.tsx          # Root Stack + Providers + Notification listener
│   ├── index.tsx            # Redirect → /events (Week 4)
│   ├── login.tsx            # หน้าเข้าสู่ระบบ (Week 8)
│   ├── +not-found.tsx       # Fallback route (Week 4)
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Bottom Tabs (Week 4)
│   │   ├── events.tsx       # รายการกิจกรรม (Week 1-7)
│   │   ├── favorites.tsx    # รายการโปรด (Week 2,5)
│   │   ├── create.tsx       # สร้างกิจกรรม + Image Picker (Week 5,9)
│   │   └── profile.tsx      # โปรไฟล์ (Week 1,2,8)
│   ├── events/
│   │   └── [id].tsx         # รายละเอียด + Map + Reminder (Week 4,10,11)
│   └── register/
│       └── [id].tsx         # ลงทะเบียนเข้าร่วม (Week 5,6)
└── src/
    ├── types/event.ts       # TypeScript types (Week 1)
    ├── data/mockEvents.ts   # Mock data (Week 2)
    ├── services/
    │   ├── api.ts           # REST API + Type guard (Week 6)
    │   ├── db.ts            # SQLite offline DB (Week 7)
    │   ├── storage.ts       # AsyncStorage cache (Week 7)
    │   └── notifications.ts # Local notifications (Week 11)
    ├── contexts/
    │   ├── FavoritesContext.tsx  # useReducer + AsyncStorage (Week 5,7)
    │   └── AuthContext.tsx       # SecureStore session (Week 8)
    └── components/
        ├── EventCard.tsx        # Reusable card (Week 2,3)
        ├── FeedbackStates.tsx   # Loading/Empty/Error (Week 3)
        └── OfflineBanner.tsx    # Offline indicator (Week 7)
```

---

## 🔧 ฟีเจอร์ครอบคลุมตามสัปดาห์

| สัปดาห์ | เนื้อหา | ตำแหน่งในโค้ด |
|---|---|---|
| 1 | TypeScript types, Profile screen | `src/types/`, `(tabs)/profile.tsx` |
| 2 | EventCard, typed props, Favorite toggle | `src/components/EventCard.tsx` |
| 3 | FlatList, responsive grid, Loading/Empty/Error | `(tabs)/events.tsx`, `FeedbackStates.tsx` |
| 4 | Expo Router, Stack, Tabs, Dynamic routes | `app/_layout.tsx`, `app/(tabs)/`, `events/[id].tsx` |
| 5 | Forms, Validation, useReducer, Context | `(tabs)/create.tsx`, `register/[id].tsx`, `FavoritesContext.tsx` |
| 6 | REST API layer, Type guards, AbortController | `src/services/api.ts` |
| 7 | AsyncStorage, SQLite, Offline banner | `src/services/storage.ts`, `db.ts`, `OfflineBanner.tsx` |
| 8 | SecureStore, Protected routes, Session restore | `src/contexts/AuthContext.tsx`, `app/login.tsx`, `app/_layout.tsx` |
| 9 | Image Picker, Camera permissions | `(tabs)/create.tsx` |
| 10 | MapView, Marker, Location permission | `app/events/[id].tsx` |
| 11 | Local notifications, Android channel, Deep link | `src/services/notifications.ts`, `app/_layout.tsx` |

---

## 🐛 ปัญหาที่พบและแนวทางแก้ไข

| ปัญหา | วิธีแก้ |
|---|---|
| node_modules มี path ยาวเกินไปบน Windows | ใช้ `cmd /c rmdir /s /q node_modules` แทน PowerShell |
| expo install ไม่ทำงาน | รัน `npm install` ก่อน แล้วค่อย `npx expo install` |
| Map ไม่แสดงบน Expo Go (Android) | ปกติบน Expo Go ใช้ได้, Production ต้องตั้ง Google Maps API Key |

---

## ✅ Definition of Done

- [x] เริ่มแอปได้ด้วย `npx expo start`
- [x] ไฟล์หน้าจอเป็น `.tsx` ทั้งหมด
- [x] ไม่มี `any` ที่หลีกเลี่ยงได้
- [x] Profile ใช้ typed object
- [x] ไม่มี secret หรือ node_modules ใน Git
- [x] Protected routes ด้วย Stack.Protected
- [x] Favorite บันทึกถาวรผ่าน AsyncStorage
- [x] Offline banner แสดงเมื่อไม่มีเน็ต
- [x] Notification reminder + deep link ทำงาน
- [x] Map แสดง venue โดยไม่ต้องใช้ location permission

---

*Campus Events Mobile — สัปดาห์ 1–11 · Expo SDK 57 · React Native · TypeScript · Expo Router*
