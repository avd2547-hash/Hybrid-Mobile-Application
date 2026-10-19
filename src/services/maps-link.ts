// ─── แยกพิกัดจากลิงก์ Google Maps (Week 10) ──────────────────────────────
// รองรับรูปแบบที่พบบ่อย:
//  1) https://www.google.com/maps?q=16.4742,102.8231
//  2) https://maps.google.com/?q=16.4742,102.8231
//  3) https://www.google.com/maps/@16.4742,102.8231,17z
//  4) https://www.google.com/maps/place/.../@16.4742,102.8231,17z
//  5) https://www.google.com/maps/place/.../@16.4742,102.8231,3d,17z ฯลฯ
//  6) ลิงก์ share สั้น https://maps.app.goo.gl/... (เปิดแล้ว redirect จึงต้อง fetch)

export type MapCoords = { latitude: number; longitude: number };

/** ลองดึงพิกัดจาก URL ของ Google Maps — คืน null ถ้าไม่พบ */
export function extractCoordsFromMapsUrl(rawUrl: string): MapCoords | null {
  if (!rawUrl.trim()) return null;

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const hostname = url.hostname.replace(/^www\./, '');
  if (
    !hostname.endsWith('google.com') &&
    !hostname.endsWith('maps.google.com') &&
    hostname !== 'maps.app.goo.gl' &&
    hostname !== 'goo.gl'
  ) {
    return null;
  }

  // รูปแบบ 1-2: query param ?q=lat,lng หรือ ?query=lat,lng
  const q = url.searchParams.get('q') ?? url.searchParams.get('query');
  if (q) {
    const fromQuery = parseLatLng(q);
    if (fromQuery) return fromQuery;
  }

  // รูปแบบ 3-5: path แบบ @lat,lng,zoom
  const atMatch = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const latitude = Number(atMatch[1]);
    const longitude = Number(atMatch[2]);
    if (isValidCoords(latitude, longitude)) return { latitude, longitude };
  }

  // รูปแบบเสริม: /place/xxx/ll=lat,lng (แบบ ll param)
  const ll = url.searchParams.get('ll');
  if (ll) {
    const fromLl = parseLatLng(ll);
    if (fromLl) return fromLl;
  }

  return null;
}

/** ลิงก์สั้น (maps.app.goo.gl) ต้อง resolve ด้วย fetch ตาม redirect */
export async function resolveShortMapsUrl(rawUrl: string): Promise<MapCoords | null> {
  const direct = extractCoordsFromMapsUrl(rawUrl);
  if (direct) return direct;

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (url.hostname !== 'maps.app.goo.gl' && url.hostname !== 'goo.gl') return null;

  try {
    // HEAD + redirect: manual เพื่ออ่าน Location header (เบากว่า GET เต็ม)
    const res = await fetch(rawUrl, { method: 'GET', redirect: 'follow' });
    const finalUrl = res.url;
    if (finalUrl) return extractCoordsFromMapsUrl(finalUrl);
  } catch {
    return null;
  }
  return null;
}

function parseLatLng(s: string): MapCoords | null {
  const parts = s.split(',').map((p) => p.trim());
  if (parts.length < 2) return null;
  const latitude = Number(parts[0]);
  const longitude = Number(parts[1]);
  if (!isValidCoords(latitude, longitude)) return null;
  return { latitude, longitude };
}

function isValidCoords(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}
