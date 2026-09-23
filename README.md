# Udon POI Guide & Multi-Feature Hub (All-in-One) 🚀

แอปพลิเคชันรวมสุดยอดฟีเจอร์จากทั้ง 4 โปรเจกต์ไว้ในที่เดียว พัฒนาด้วย **React Native**, **Expo SDK 54**, และ **TypeScript** รองรับการทดสอบรันบน **Expo Go**

---

## 🌟 ฟีเจอร์ทั้ง 4 ส่วนที่รวมไว้ในแอปเดียว

### 1. 🗺️ แผนที่สถานที่สำคัญอุดรธานี (Udon POI Guide)
- แสดงรายชื่อสถานที่สำคัญ 10 แห่งในจังหวัดอุดรธานี
- แผนที่ตอบสนองอัตโนมัติ: แตะเลือกสถานที่เพื่อเลื่อนและซูมไปยังพิกัดจริง
- หมุด Marker แสดงข้อมูลชื่อไทย, อังกฤษ และอำเภอ
- มีปุ่มลัด **"ถ่ายรูปเช็คอิน"** เชื่อมโยงเข้าสู่ระบบกล้องถ่ายภาพได้ทันที

### 2. 📷 กล้องถ่ายภาพพร้อมฟิลเตอร์ (Prism Camera)
- สลับกล้องหน้าและกล้องหลังได้
- ฟิลเตอร์ตกแต่งสีภาพ 3 รูปแบบ:
  - **Natural**: สีธรรมชาติ
  - **Mono**: สไตล์ขาวดำคลาสสิก
  - **Pop**: สีสดใส คอนทราสต์ชัดเจน
- หน้าดูตัวอย่างรูปภาพ (Preview) พร้อมสลับเลือกฟิลเตอร์
- บันทึกรูปลงคลังภาพของเครื่อง (Media Library) ได้จริง

### 3. ⚡ สารานุกรมโปเกมอน (Pokédex & Favorites)
- เชื่อมต่อดึงข้อมูลจาก PokéAPI (เจน 1 ครบ 151 ตัว)
- ค้นหาโปเกมอนตามชื่อแบบ Real-time (ไม่สนตัวพิมพ์เล็ก-ใหญ่)
- กรองโปเกมอนตามชนิด (Type Filter) พร้อมชื่อธาตุภาษาไทย
- ระบบ **บันทึกรายการโปรด (Favorites)** จัดเก็บถาวรในเครื่องผ่าน AsyncStorage
- หน้ารายละเอียดโปเกมอน (Modal Detail) แสดงภาพทางการ, ค่าพลังพื้นฐาน (Base Stats), ความสามารถ, ส่วนสูง และน้ำหนัก

### 4. 👤 ประวัติและข้อมูลผู้พัฒนา (Developer Profile)
- แสดงรูปโปรไฟล์, ชื่อ-นามสกุล, รหัสนักศึกษา, สาขาวิชา/คณะ
- ปุ่มกดเพื่อติดต่อผ่านอีเมล (kkumail)
- ลิงก์ Social Media เชื่อมต่อเปิดได้ทันที (Facebook, Instagram, GitHub)

---

## 🚀 วิธีเปิดใช้งานโปรเจกต์

1. เข้ามายังโฟลเดอร์โปรเจกต์:
   ```bash
   cd udon-poi-guide-main/udon-poi-guide-main
   ```

2. เริ่มต้นรัน Expo:
   ```bash
   npx expo start
   ```

3. สแกน QR Code ด้วยแอป **Expo Go** บนโทรศัพท์มือถือ (ต้องเชื่อมต่อ Wi-Fi เดียวกัน)
   - หากเน็ตคนละวง ให้ใช้คำสั่ง Tunnel:
     ```bash
     npx expo start --tunnel
     ```

---

## 📁 โครงสร้างโปรเจกต์หลังการรวม

```text
udon-poi-guide-main/
├── App.tsx                    # หน้าควบคุมหลักพร้อม Navigation Bottom Tab Bar
├── app.json                   # ตั้งค่า permissions (กล้อง, คลังภาพ, แผนที่)
├── package.json               # Dependencies ทั้งหมด
└── src/
    ├── components/            # คอมโพเนนต์ Reusable
    │   ├── EmptyState.tsx
    │   ├── PokemonCard.tsx
    │   ├── PokemonDetailModal.tsx
    │   ├── PokemonSearchBar.tsx
    │   └── TypeBadge.tsx
    ├── constants/
    │   └── Pokemon.ts         # ชนิด, สี, URL API โปเกมอน
    ├── contexts/
    │   └── FavoritesContext.tsx # Context จัดการ AsyncStorage รายการโปรด
    ├── data/
    │   └── places.ts          # พิกัดและข้อมูล 10 สถานที่ในอุดรธานี
    ├── screens/               # หน้าจอของทั้ง 4 ฟีเจอร์
    │   ├── CameraScreen.tsx   # หน้ากล้องถ่ายภาพ & ฟิลเตอร์
    │   ├── MapGuideScreen.tsx # หน้าแผนที่ท่องเที่ยว
    │   ├── PokemonScreen.tsx  # หน้าสารานุกรมโปเกมอน & รายการโปรด
    │   └── ProfileScreen.tsx  # หน้าโปรไฟล์ผู้พัฒนา
    └── utils/
        └── photoFilters.ts    # ฟังก์ชันประมวลผลฟิลเตอร์ภาพ
```
