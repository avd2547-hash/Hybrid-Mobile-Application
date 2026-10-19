import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/Colors';
import {
  formatDistance,
  googleMapsDirectionsUrl,
  haversineDistanceKm,
  LatLng,
} from '../services/distance';
import { RouteResult } from '../services/routing';

// Web: แผนที่จริงจาก OpenStreetMap embed + เส้นทางขับรถจริง (bbox ครอบเส้นทาง) + ปุ่มนำทาง
export type EventMapProps = {
  title: string;
  venueName: string;
  latitude: number;
  longitude: number;
  userLocation?: LatLng | null;
  /** เส้นทางขับรถจริงจาก OSRM (ถ้าโหลดสำเร็จ) */
  route?: RouteResult | null;
};

export function EventMap({
  title,
  venueName,
  latitude,
  longitude,
  userLocation,
  route,
}: EventMapProps) {
  // bbox ครอบหมุดสถานที่ + ตำแหน่งผู้ใช้ + ทั้งเส้นทางขับรถ (ถ้ามี)
  const lats = [latitude, ...(userLocation ? [userLocation.latitude] : [])];
  const lons = [longitude, ...(userLocation ? [userLocation.longitude] : [])];
  if (route) {
    for (const c of route.coordinates) {
      lats.push(c.latitude);
      lons.push(c.longitude);
    }
  }
  const pad = 0.001;
  const bbox = [
    Math.min(...lons) - pad,
    Math.min(...lats) - pad,
    Math.max(...lons) + pad,
    Math.max(...lats) + pad,
  ].join(',');

  const markers = [
    `${latitude},${longitude}`,
    ...(userLocation ? [`${userLocation.latitude},${userLocation.longitude}`] : []),
  ].join('&marker=');

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${markers}`;

  const distanceKm = userLocation
    ? haversineDistanceKm(userLocation, { latitude, longitude })
    : null;

  const openDirections = () => {
    window.open(
      googleMapsDirectionsUrl({ latitude, longitude }),
      '_blank',
      'noopener',
    );
  };

  return (
    <View style={styles.container}>
      <iframe
        src={src}
        style={styles.iframe}
        title={`แผนที่ ${title}`}
        loading="lazy"
      />

      <View style={styles.overlays}>
        {distanceKm !== null && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              📍 ห่างจากคุณ {formatDistance(distanceKm)}
            </Text>
          </View>
        )}
        {route && (
          <View style={styles.routeBadge}>
            <Text style={styles.routeText}>
              🚗 ขับรถ {formatDistance(route.distanceMeters / 1000)} · ≈{' '}
              {Math.max(1, Math.round(route.durationSeconds / 60))} นาที
            </Text>
          </View>
        )}
        <View style={styles.caption}>
          <Text style={styles.text}>📍 {venueName}</Text>
          <Text style={styles.coords}>
            {latitude.toFixed(5)}, {longitude.toFixed(5)} · © OpenStreetMap
          </Text>
        </View>
      </View>

      {/* ปุ่มนำทาง Google Maps — อ้างอิงเส้นทางจริงจาก Google */}
      <Pressable style={styles.dirButton} onPress={openDirections} accessibilityRole="button" accessibilityLabel="นำทางด้วย Google Maps">
        <Text style={styles.dirText}>🧭 นำทางด้วย Google Maps</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 220,
    backgroundColor: Theme.primaryTint,
    borderWidth: 1,
    borderColor: Theme.primaryBorder,
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  } as never,
  overlays: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    gap: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Theme.primaryBorder,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: Theme.primary },
  routeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Theme.primaryBorder,
  },
  routeText: { fontSize: 12, fontWeight: '700', color: Theme.primarySoft },
  caption: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    gap: 1,
  },
  text: { fontSize: 11, fontWeight: '700', color: Theme.primary },
  coords: { fontSize: 10, color: Theme.primarySoft },
  dirButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Theme.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dirText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
