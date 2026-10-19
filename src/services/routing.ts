// ─── ระบบนำทาง turn-by-turn (Week 10+) ─────────────────────────────────────
// ดึงเส้นทางขับรถจริงตามถนนจาก OSRM (ข้อมูล OpenStreetMap, ฟรี ไม่ต้องใช้ API key)
// แล้วแปลงคำสั่งเลี้ยวเป็นภาษาไทย + ไอคอน

import { LatLng } from './distance';

/** จุดเลี้ยวหนึ่งจุดในเส้นทาง */
export type RouteStep = {
  /** คำแนะนำภาษาไทย เช่น "เลี้ยวขวาเข้าถนน มหาวิทยาลัย" */
  instruction: string;
  /** ชื่อถนน (ถ้ามี) */
  roadName?: string;
  /** ระยะทางช่วงนี้ เป็นเมตร */
  distanceMeters: number;
  /** ไอคอนแสดงทิศทาง */
  icon: string;
  /** พิกัดจุดเลี้ยวนี้ */
  location: LatLng;
};

export type RouteResult = {
  /** จุดพิกัดเรียงต่อกันของเส้นทาง (วาดบนแมพ) */
  coordinates: LatLng[];
  /** ระยะทางรวมตามถนน เป็นเมตร */
  distanceMeters: number;
  /** เวลาโดยสารโดยประมาณ เป็นวินาที */
  durationSeconds: number;
  /** คำแนะนำ turn-by-turn ภาษาไทย */
  steps: RouteStep[];
};

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

/** จัดรูปแบบระยะทางเป็นเมตร/กิโลเมตร (ใช้ในลิสต์คำแนะนำ) */
function formatStepDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} ม.`;
  if (meters < 10000) return `${(meters / 1000).toFixed(1)} กม.`;
  return `${Math.round(meters / 1000)} กม.`;
}

/** แปลง maneuver ของ OSRM เป็นภาษาไทย + ไอคอน */
function maneuverToThai(
  type: string,
  modifier: string | undefined,
  roadName: string | undefined,
): { instruction: string; icon: string } {
  const road = roadName ? ` เข้า${roadName}` : '';
  const onRoad = roadName ? ` บน${roadName}` : '';

  switch (type) {
    case 'depart':
      return { instruction: `🚗 เริ่มต้นเส้นทาง${onRoad}`, icon: '🚗' };
    case 'arrive':
      return { instruction: '🏁 ถึงสถานที่จัดกิจกรรม', icon: '🏁' };
    case 'turn':
    case 'end of road':
    case 'fork': {
      switch (modifier) {
        case 'left':
          return { instruction: `⬅️ เลี้ยวซ้าย${road}`, icon: '⬅️' };
        case 'right':
          return { instruction: `➡️ เลี้ยวขวา${road}`, icon: '➡️' };
        case 'slight left':
          return { instruction: `↖️ เลี้ยวซ้ายเล็กน้อย${road}`, icon: '↖️' };
        case 'slight right':
          return { instruction: `↗️ เลี้ยวขวาเล็กน้อย${road}`, icon: '↗️' };
        case 'sharp left':
          return { instruction: `⬅️ เลี้ยวซ้ายเฉียงแหลม${road}`, icon: '⬅️' };
        case 'sharp right':
          return { instruction: `➡️ เลี้ยวขวาเฉียงแหลม${road}`, icon: '➡️' };
        case 'straight':
          return { instruction: `⬆️ ตรงไป${road}`, icon: '⬆️' };
        case 'uturn':
          return { instruction: `↩️ กลับรถ${road}`, icon: '↩️' };
        default:
          return { instruction: `➡️ เลี้ยว${road}`, icon: '➡️' };
      }
    }
    case 'roundabout':
    case 'rotary':
      return { instruction: `🔄 เข้าวงแหวน ออกทางออกที่ 1${road}`, icon: '🔄' };
    case 'roundabout turn':
      return { instruction: `🔄 เลี้ยวในวงแหวน${road}`, icon: '🔄' };
    case 'merge':
      return { instruction: `🔀 รวมเข้าเลน${road}`, icon: '🔀' };
    case 'on ramp':
      return { instruction: `🛣️ ขึ้นทางคู่ขนาน${road}`, icon: '🛣️' };
    case 'off ramp':
      return { instruction: `🛣️ ลงทางคู่ขนาน${road}`, icon: '🛣️' };
    case 'continue':
      return { instruction: `⬆️ ไปต่อ${onRoad}`, icon: '⬆️' };
    case 'new name':
      return { instruction: `⬆️ ตรงไป${road}`, icon: '⬆️' };
    default:
      return { instruction: `⬆️ ไปต่อ${onRoad}`, icon: '⬆️' };
  }
}

/** เรียก OSRM ขอเส้นทางขับรถจากจุดเริ่มไปจุดปลาย (lon,lat;lon,lat) */
export async function fetchRoute(
  from: LatLng,
  to: LatLng,
  signal?: AbortSignal,
): Promise<RouteResult> {
  const url = `${OSRM_BASE}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson&steps=true`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('route-request-failed');
  const data = (await res.json()) as {
    code: string;
    routes?: Array<{
      distance: number;
      duration: number;
      geometry: { coordinates: [number, number][] };
      legs: Array<{
        steps: Array<{
          maneuver: {
            type: string;
            modifier?: string;
            location: [number, number];
          };
          distance: number;
          name: string;
        }>;
      }>;
    }>;
  };

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('route-not-found');
  }

  const route = data.routes[0];

  const coordinates: LatLng[] = route.geometry.coordinates.map(
    ([lon, lat]) => ({ latitude: lat, longitude: lon }),
  );

  const steps: RouteStep[] = [];
  for (const leg of route.legs) {
    for (const step of leg.steps) {
      const { instruction, icon } = maneuverToThai(
        step.maneuver.type,
        step.maneuver.modifier,
        step.name || undefined,
      );
      steps.push({
        instruction:
          step.distance > 0
            ? `${instruction} (ไป ${formatStepDistance(step.distance)})`
            : instruction,
        roadName: step.name || undefined,
        distanceMeters: step.distance,
        icon,
        location: {
          latitude: step.maneuver.location[1],
          longitude: step.maneuver.location[0],
        },
      });
    }
  }

  return {
    coordinates,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    steps,
  };
}

/** จัดรูปแบบเวลาโดยสารเป็นภาษาไทย */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return 'น้อยกว่า 1 นาที';
  if (mins < 60) return `${mins} นาที`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} ชม. ${mins % 60} นาที`;
}
