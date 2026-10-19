// ─── คำนวณระยะทาง (Week 10) ───────────────────────────────────────────────
// Haversine formula — ระยะทางระหว่างพิกัด 2 จุดบนพื้นโลก (กิโลเมตร)

export type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** จัดรูปแบบระยะทางสำหรับแสดงผล — <1 กม. แสดงเป็นเมตร */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} ม.`;
  if (km < 10) return `${km.toFixed(1)} กม.`;
  return `${Math.round(km)} กม.`;
}

/** ลิงก์นำทาง Google Maps — เปิดแล้วขึ้นเส้นทางจากตำแหน่งปัจจุบันไปสถานที่ */
export function googleMapsDirectionsUrl(dest: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}&travelmode=driving`;
}
