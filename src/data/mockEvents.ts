import { CampusEvent } from '../types/event';

export const MOCK_EVENTS: CampusEvent[] = [
  {
    id: '1',
    title: 'Workshop: React Native for Beginners',
    description:
      'เรียนรู้การสร้างแอปมือถือด้วย React Native ตั้งแต่เริ่มต้น เหมาะสำหรับนักศึกษาที่มีพื้นฐาน JavaScript ผ่านมาแล้ว',
    startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Workshop',
    capacity: 30,
    registeredCount: 18,
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
    location: {
      // โซนอาคารเรียนรวมฯ (GL) ข้างหอสมุดกลาง — ที่ตั้งคณะสหวิทยาการ มข.
      name: 'ห้องปฏิบัติการคอมพิวเตอร์ 101 อาคารสหวิทยาการ',
      latitude: 16.4765,
      longitude: 102.8243,
    },
  },
  {
    id: '2',
    title: 'งานแฟร์นักศึกษา: Career Fair 2026',
    description:
      'พบกับบริษัทชั้นนำกว่า 50 แห่งที่เปิดรับสมัครงานและนักศึกษาฝึกงาน พร้อมเซสชันสัมภาษณ์สดจากผู้เชี่ยวชาญ',
    startsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Career',
    capacity: 500,
    registeredCount: 342,
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    location: {
      // หอประชุมกาญจนาภิเษก (Golden Jubilee Convention Hall) — หอประชุมใหญ่ของ มข.
      name: 'หอประชุมใหญ่ มหาวิทยาลัยขอนแก่น',
      latitude: 16.446545,
      longitude: 102.817152,
    },
  },
  {
    id: '3',
    title: 'กีฬาประจำคณะ: IT Sports Day',
    description:
      'กิจกรรมกีฬาสีประจำปีของคณะ มีทั้งฟุตบอล บาสเกตบอล วอลเลย์บอล และกีฬาพื้นบ้าน พร้อมมอบเกียรติบัตรผู้เข้าร่วม',
    startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Sports',
    capacity: 200,
    registeredCount: 145,
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    location: {
      // KKU Sports Complex — ศูนย์กีฬามหาวิทยาลัยขอนแก่น (มีสนามในร่ม)
      name: 'สนามกีฬาในร่ม อาคารพลศึกษา',
      latitude: 16.476317,
      longitude: 102.817794,
    },
  },
  {
    id: '4',
    title: 'สัมมนา: AI & the Future of Work',
    description:
      'ผู้เชี่ยวชาญด้าน AI จากอุตสาหกรรมและวงวิชาการมาร่วมพูดคุยถึงผลกระทบของ AI ต่อตลาดงานในอนาคต',
    startsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Academic',
    capacity: 150,
    registeredCount: 120,
    imageUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800',
    location: {
      // คณะวิทยาศาสตร์ ตึก SC06 — แถวตึก SC ของ มข.
      name: 'ห้องประชุม 301 อาคาร SC.07',
      latitude: 16.474091,
      longitude: 102.823444,
    },
  },
  {
    id: '5',
    title: 'วันวัฒนธรรมนานาชาติ: International Culture Day',
    description:
      'สัมผัสวัฒนธรรมกว่า 20 ประเทศผ่านอาหาร การแสดง และนิทรรศการ จัดโดยสมาคมนักศึกษาต่างชาติ',
    startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Cultural',
    capacity: 300,
    registeredCount: 210,
    imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    location: {
      // ลานกีฬา/สนามบาสสี่สนาม หน้าศูนย์กีฬา มข.
      name: 'ลานอเนกประสงค์หน้าอาคารกีฬา',
      latitude: 16.476441,
      longitude: 102.816660,
    },
  },
  {
    id: '6',
    title: 'Hackathon: Smart Campus Challenge',
    description:
      'แข่งขันพัฒนาแอปพลิเคชันภายใน 24 ชั่วโมง ในหัวข้อ "Smart Campus" ชิงรางวัลมูลค่ากว่า 50,000 บาท',
    startsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Workshop',
    capacity: 60,
    registeredCount: 47,
    imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
    location: {
      // หอสมุดกลาง มข. (KKU Library) — มี Co-Working Space
      name: 'Co-Working Space ชั้น 3 อาคารนวัตกรรม',
      latitude: 16.476535,
      longitude: 102.823243,
    },
  },
];
