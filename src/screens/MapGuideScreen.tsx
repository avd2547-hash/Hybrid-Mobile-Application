import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Callout, MapMarker, Marker, Region } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Place, PLACES } from '../data/places';

const COLORS = {
  background: '#F7F1E7',
  surface: '#FFFCF7',
  ink: '#2F2924',
  muted: '#7B6F65',
  terracotta: '#B75B3E',
  terracottaDark: '#8F3F2A',
  line: '#E8D9C9',
  chip: '#F3E2D2',
  white: '#FFFFFF',
};

const INITIAL_REGION: Region = {
  latitude: 17.4138,
  longitude: 102.789,
  latitudeDelta: 0.055,
  longitudeDelta: 0.055,
};

const regionFor = (place: Place): Region => ({
  latitude: place.latitude,
  longitude: place.longitude,
  latitudeDelta: 0.028,
  longitudeDelta: 0.028,
});

interface MapGuideScreenProps {
  onCheckInWithCamera?: (placeName: string) => void;
}

export default function MapGuideScreen({ onCheckInWithCamera }: MapGuideScreenProps) {
  const mapRef = useRef<MapView>(null);
  const markerRef = useRef<MapMarker>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place>(PLACES[0]!);
  const [mapReady, setMapReady] = useState(false);

  const showSelectedPlace = (place: Place) => {
    setSelectedPlace(place);
    mapRef.current?.animateToRegion(regionFor(place), 650);
  };

  useEffect(() => {
    if (!mapReady) return;
    const timer = setTimeout(() => markerRef.current?.showCallout(), 720);
    return () => clearTimeout(timer);
  }, [mapReady, selectedPlace]);

  const renderPlace: ListRenderItem<Place> = ({ item, index }) => {
    const isSelected = item.id === selectedPlace.id;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`แสดง ${item.name} บนแผนที่`}
        onPress={() => showSelectedPlace(item)}
        style={({ pressed }) => [
          styles.placeCard,
          isSelected && styles.placeCardSelected,
          pressed && styles.placeCardPressed,
        ]}
      >
        <View style={[styles.numberBadge, isSelected && styles.numberBadgeSelected]}>
          <Text style={[styles.numberText, isSelected && styles.numberTextSelected]}>
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>

        <View style={[styles.placeIcon, isSelected && styles.placeIconSelected]}>
          <MaterialCommunityIcons
            name={item.icon as never}
            size={22}
            color={isSelected ? COLORS.white : COLORS.terracotta}
          />
        </View>

        <View style={styles.placeCopy}>
          <Text numberOfLines={1} style={styles.placeName}>
            {item.name}
          </Text>
          <Text numberOfLines={1} style={styles.placeMeta}>
            {item.category} · {item.district}
          </Text>
        </View>

        <MaterialCommunityIcons
          name={isSelected ? 'map-marker' : 'chevron-right'}
          size={20}
          color={isSelected ? COLORS.terracotta : COLORS.muted}
        />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>🗺️ แนะนำ 10 สถานที่สำคัญอุดรธานี</Text>
          {onCheckInWithCamera && (
            <Pressable
              onPress={() => onCheckInWithCamera(selectedPlace.name)}
              style={styles.cameraCheckInBtn}
            >
              <MaterialCommunityIcons name="camera" size={16} color="#FFF" />
              <Text style={styles.cameraCheckInText}>ถ่ายรูปเช็คอิน</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.headerSubtitle}>
          แตะที่รายชื่อเพื่อเลื่อนแผนที่ไปยังพิกัดจริง
        </Text>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          initialRegion={INITIAL_REGION}
          onMapReady={() => setMapReady(true)}
          style={styles.map}
        >
          {PLACES.map((place) => {
            const isSelected = place.id === selectedPlace.id;
            return (
              <Marker
                key={place.id}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                ref={isSelected ? markerRef : undefined}
                title={place.name}
                description={`${place.nameEn} · ${place.district}`}
                pinColor={isSelected ? COLORS.terracotta : '#607D8B'}
              >
                <Callout tooltip>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{place.name}</Text>
                    <Text style={styles.calloutEn}>{place.nameEn}</Text>
                    <Text style={styles.calloutDistrict}>{place.district}</Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        {/* Selected Place Badge on Map */}
        <View style={styles.mapOverlayCard}>
          <Text style={styles.overlayCategory}>{selectedPlace.category}</Text>
          <Text style={styles.overlayName}>{selectedPlace.name}</Text>
          <Text style={styles.overlayEn}>{selectedPlace.nameEn}</Text>
        </View>
      </View>

      {/* Places List */}
      <View style={styles.listSection}>
        <Text style={styles.listSectionTitle}>สถานที่ทั้งหมด (10 แห่ง)</Text>
        <FlatList
          data={PLACES}
          renderItem={renderPlace}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },
  cameraCheckInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.terracotta,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  cameraCheckInText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mapContainer: {
    height: '42%',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlayCard: {
    position: 'absolute',
    top: 10,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  overlayCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.terracotta,
    textTransform: 'uppercase',
  },
  overlayName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  overlayEn: {
    fontSize: 11,
    color: COLORS.muted,
  },
  callout: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    minWidth: 180,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  calloutEn: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  calloutDistrict: {
    fontSize: 10,
    color: COLORS.terracotta,
    marginTop: 2,
    fontWeight: '600',
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  listSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.muted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 20,
    gap: 6,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  placeCardSelected: {
    borderColor: COLORS.terracotta,
    backgroundColor: '#FFF8F4',
  },
  placeCardPressed: {
    opacity: 0.8,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  numberBadgeSelected: {
    backgroundColor: COLORS.terracotta,
  },
  numberText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.terracottaDark,
  },
  numberTextSelected: {
    color: COLORS.white,
  },
  placeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  placeIconSelected: {
    backgroundColor: COLORS.terracotta,
  },
  placeCopy: {
    flex: 1,
  },
  placeName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  placeMeta: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
});
