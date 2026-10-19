import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/Colors';
import {
  formatDistance,
  haversineDistanceKm,
  LatLng,
} from '../services/distance';
import { RouteResult } from '../services/routing';

// Week 10: แผนที่แสดงหมุด Venue + เส้นทางขับรถจริงตามถนน + ระยะทาง (native)
export type EventMapProps = {
  title: string;
  venueName: string;
  latitude: number;
  longitude: number;
  userLocation?: LatLng | null; // ตำแหน่งปัจจุบันของโทรศัพท์ (ถ้าอนุญาต)
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
  const venue = { latitude, longitude };
  const distanceKm =
    userLocation ? haversineDistanceKm(userLocation, venue) : null;

  // ถ้ามีเส้นทางจริง ให้ map กินพื้นที่ครอบทั้งเส้นทาง
  const region = route && route.coordinates.length > 1
    ? {
        latitude: (route.coordinates[0].latitude + latitude) / 2,
        longitude:
          (route.coordinates[0].longitude + longitude) / 2,
        latitudeDelta:
          Math.abs(route.coordinates[0].latitude - latitude) * 2 + 0.01,
        longitudeDelta:
          Math.abs(route.coordinates[0].longitude - longitude) * 2 + 0.01,
      }
    : {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation={!!userLocation}
        accessibilityLabel="แผนที่สถานที่จัดกิจกรรม"
      >
        <Marker coordinate={venue} title={title} description={venueName} />
        {userLocation && !route && (
          <Polyline
            coordinates={[userLocation, venue]}
            strokeColor={Theme.primary}
            strokeWidth={2}
            lineDashPattern={[6, 4]}
          />
        )}
        {route && route.coordinates.length > 1 && (
          <Polyline
            coordinates={route.coordinates}
            strokeColor={Theme.primarySoft}
            strokeWidth={4}
          />
        )}
      </MapView>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, overflow: 'hidden', height: 200 },
  map: { flex: 1 },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Theme.primaryBorder,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: Theme.primary },
  routeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Theme.primaryBorder,
  },
  routeText: { fontSize: 12, fontWeight: '700', color: Theme.primarySoft },
});
