export type Place = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  district: string;
  icon: string;
  latitude: number;
  longitude: number;
};

export const PLACES: Place[] = [
  {
    id: 'nong-prajak',
    name: 'สวนสาธารณะหนองประจักษ์',
    nameEn: 'Nong Prajak Park',
    category: 'ธรรมชาติ',
    district: 'อำเภอเมืองอุดรธานี',
    icon: 'tree-outline',
    latitude: 17.41747,
    longitude: 102.7818,
  },
  {
    id: 'city-pillar',
    name: 'ศาลหลักเมืองอุดรธานี',
    nameEn: 'Udon Thani City Pillar Shrine',
    category: 'ศาสนาและความเชื่อ',
    district: 'อำเภอเมืองอุดรธานี',
    icon: 'temple-buddhist-outline',
    latitude: 17.413497,
    longitude: 102.787601,
  },
  {
    id: 'thai-chinese',
    name: 'ศูนย์วัฒนธรรมไทย–จีน',
    nameEn: 'Thai-Chinese Cultural Center',
    category: 'วัฒนธรรม',
    district: 'อำเภอเมืองอุดรธานี',
    icon: 'gate',
    latitude: 17.399107,
    longitude: 102.807086,
  },
  {
    id: 'wat-phothisomphon',
    name: 'วัดโพธิสมภรณ์',
    nameEn: 'Wat Pothisomphon',
    category: 'ศาสนสถาน',
    district: 'อำเภอเมืองอุดรธานี',
    icon: 'temple-buddhist',
    latitude: 17.41321,
    longitude: 102.77894,
  },
  {
    id: 'udon-museum',
    name: 'พิพิธภัณฑ์เมืองอุดรธานี',
    nameEn: 'Udon Thani Museum',
    category: 'พิพิธภัณฑ์',
    district: 'อำเภอเมืองอุดรธานี',
    icon: 'bank-outline',
    latitude: 17.412303,
    longitude: 102.782158,
  },
  {
    id: 'central-udon',
    name: 'เซ็นทรัล อุดร',
    nameEn: 'Central Udon',
    category: 'ไลฟ์สไตล์',
    district: 'อำเภอเมืองอุดรธานี',
    icon: 'shopping-outline',
    latitude: 17.40597,
    longitude: 102.80032,
  },
  {
    id: 'ud-town',
    name: 'ยูดี ทาวน์',
    nameEn: 'UD Town',
    category: 'ไลฟ์สไตล์',
    district: 'อำเภอเมืองอุดรธานี',
    icon: 'storefront-outline',
    latitude: 17.4021,
    longitude: 102.80457,
  },
  {
    id: 'ban-chiang',
    name: 'พิพิธภัณฑสถานแห่งชาติ บ้านเชียง',
    nameEn: 'Ban Chiang National Museum',
    category: 'ประวัติศาสตร์',
    district: 'อำเภอหนองหาน',
    icon: 'pot-mix-outline',
    latitude: 17.40778,
    longitude: 103.23578,
  },
  {
    id: 'red-lotus-lake',
    name: 'ทะเลบัวแดง',
    nameEn: 'Red Lotus Lake',
    category: 'ธรรมชาติ',
    district: 'อำเภอกุมภวาปี',
    icon: 'flower-tulip-outline',
    latitude: 17.16094,
    longitude: 103.03932,
  },
  {
    id: 'phu-phrabat',
    name: 'อุทยานประวัติศาสตร์ภูพระบาท',
    nameEn: 'Phu Phrabat Historical Park',
    category: 'มรดกวัฒนธรรม',
    district: 'อำเภอบ้านผือ',
    icon: 'image-filter-hdr',
    latitude: 17.731058,
    longitude: 102.356267,
  },
];
