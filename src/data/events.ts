export type LocalEvent = {
  id: string;
  title: string;
  placeName: string;
  category: string;
  timeString: string;
  description: string;
  dateTimestamp: number; // Scheduled time in ms
  highlight: string;
};

// กิจกรรมท่องเที่ยวและวัฒนธรรมจำลองในจังหวัดอุดรธานี
export const UDON_EVENTS: LocalEvent[] = [
  {
    id: 'ev-nongprajak-run',
    title: 'กิจกรรมวิ่งชมเป็ดเหลืองยามเช้า',
    placeName: 'สวนสาธารณะหนองประจักษ์',
    category: 'สุขภาพ & กีฬา',
    timeString: '06:00 น. วันเสาร์นี้',
    dateTimestamp: Date.now() + 30 * 60 * 1000, // 30 นาทีข้างหน้า
    description: 'ร่วมวิ่งออกกำลังกายรอบหนองประจักษ์ สูดอากาศบริสุทธิ์พร้อมถ่ายรูปเช็คอินกับเป็ดเหลืองยักษ์แลนด์มาร์ก',
    highlight: 'ระยะทาง 3.5 กม. ฟรีไม่มีค่าใช้จ่าย',
  },
  {
    id: 'ev-citypillar-worship',
    title: 'พิธีบวงสรวงสักการะศาลหลักเมือง',
    placeName: 'ศาลหลักเมืองอุดรธานี',
    category: 'ประเพณี & วัฒนธรรม',
    timeString: '09:00 น. วันพรุ่งนี้',
    dateTimestamp: Date.now() + 60 * 60 * 1000,
    description: 'ร่วมสักการะสิ่งศักดิ์สิทธิ์คู่บ้านคู่เมืองอุดรธานีเพื่อความเป็นสิริมงคลแก่ตนเองและครอบครัว',
    highlight: 'รับน้ำมนต์ศักดิ์สิทธิ์และผูกผ้าเจ็ดสี',
  },
  {
    id: 'ev-redlotus-tour',
    title: 'ทริปล่องเรือชมทะเลบัวแดงบาน',
    placeName: 'ทะเลบัวแดง (กุมภวาปี)',
    category: 'ธรรมชาติ & ท่องเที่ยว',
    timeString: '06:30 น. สุดสัปดาห์นี้',
    dateTimestamp: Date.now() + 120 * 60 * 1000,
    description: 'ล่องเรือชมทัศนียภาพบัวแดงบานสะพรั่งเต็มหนองหาน กิจกรรมไฮไลต์ของจังหวัดอุดรธานี',
    highlight: 'ช่วงเวลาที่ดอกบัวบานสวยงามที่สุดคือ 06:00 - 10:00 น.',
  },
  {
    id: 'ev-baanchiang-expo',
    title: 'นิทรรศการมรดกโลกอารยธรรมบ้านเชียง',
    placeName: 'พิพิธภัณฑสถานแห่งชาติ บ้านเชียง',
    category: 'ประวัติศาสตร์',
    timeString: '10:00 น. วันอาทิตย์',
    dateTimestamp: Date.now() + 180 * 60 * 1000,
    description: 'ชมนิทรรศการเครื่องปั้นดินเผาลายเขียนสีเอกลักษณ์อายุกว่า 5,000 ปี มรดกโลกแห่งแรกของอีสาน',
    highlight: 'วิทยากรบรรยายพิเศษประวัติศาสตร์โบราณคดี',
  },
  {
    id: 'ev-thaichinese-lantern',
    title: 'เทศกาลโคมไฟและชิมชาจีนโบราณ',
    placeName: 'ศูนย์วัฒนธรรมไทย–จีน',
    category: 'วัฒนธรรม',
    timeString: '17:30 น. เย็นนี้',
    dateTimestamp: Date.now() + 240 * 60 * 1000,
    description: 'เดินเล่นสวนสไตล์จีน ให้อาหารปลาคาร์ป และชิมชาอู่หลงสูตรดั้งเดิมท่ามกลางบรรยากาศโคมไฟประดับ',
    highlight: 'มุมถ่ายภาพสไตล์จีนคลาสสิก',
  },
];
