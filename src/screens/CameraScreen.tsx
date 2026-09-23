import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { FILTERS, FilterId, processPhoto } from '../utils/photoFilters';

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions({
    writeOnly: true,
    granularPermissions: ['photo'],
  });

  const [facing, setFacing] = useState<CameraType>('back');
  const [filter, setFilter] = useState<FilterId>('original');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saved, setSaved] = useState(false);

  const permissionsLoading = !cameraPermission || !mediaPermission;
  const permissionsGranted = cameraPermission?.granted && mediaPermission?.granted;

  const askForPermissions = async () => {
    const camera = await requestCameraPermission();
    if (!camera.granted) return;
    await requestMediaPermission();
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || processing) return;
    try {
      setProcessing(true);
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.92,
        skipProcessing: false,
      });
      if (result && result.uri) {
        const uri = await processPhoto(result.uri, filter);
        setPhotoUri(uri);
        setSaved(false);
      }
    } catch (error) {
      console.error('Photo processing failed:', error);
      Alert.alert('ถ่ายรูปไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setProcessing(false);
    }
  };

  const savePhoto = async () => {
    if (!photoUri || processing) return;
    try {
      setProcessing(true);
      await MediaLibrary.saveToLibraryAsync(photoUri);
      setSaved(true);
      Alert.alert('บันทึกแล้ว ✨', 'รูปถูกจัดเก็บลงในคลังภาพเรียบร้อยแล้ว');
    } catch {
      Alert.alert('บันทึกไม่สำเร็จ', 'โปรดอนุญาตการเข้าถึงรูปภาพแล้วลองใหม่');
    } finally {
      setProcessing(false);
    }
  };

  if (permissionsLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#FF6B43" size="large" />
      </View>
    );
  }

  if (!permissionsGranted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <View style={styles.permissionArt}>
          <View style={styles.cameraCard}>
            <Ionicons color="#203B61" name="camera" size={64} />
          </View>
        </View>
        <Text style={styles.permissionEyebrow}>PRISM CAMERA</Text>
        <Text style={styles.permissionTitle}>เปิดกล้อง บันทึกภาพความประทับใจ</Text>
        <Text style={styles.permissionBody}>
          แอปต้องใช้กล้องเพื่อถ่ายภาพ และคลังภาพเพื่อบันทึกรูปพร้อมฟิลเตอร์สวยงาม
        </Text>
        <Pressable onPress={askForPermissions} style={styles.primaryButton}>
          <Ionicons color="#FFF9F1" name="camera-outline" size={20} />
          <Text style={styles.primaryButtonText}>อนุญาตและเริ่มถ่ายรูป</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Preview captured photo
  if (photoUri) {
    return (
      <SafeAreaView style={styles.previewScreen}>
        <View style={styles.previewCard}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
        </View>

        {/* Filter bar for photo */}
        <View style={styles.previewFilterBar}>
          {FILTERS.map((item) => {
            const active = item.id === filter;
            return (
              <Pressable
                key={item.id}
                onPress={async () => {
                  setFilter(item.id);
                  setProcessing(true);
                  const newUri = await processPhoto(photoUri, item.id);
                  setPhotoUri(newUri);
                  setProcessing(false);
                }}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Ionicons name={item.icon} size={16} color={active ? '#FF6B43' : '#687076'} />
                <Text style={[styles.filterName, active && styles.filterNameActive]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Action buttons */}
        <View style={styles.previewActions}>
          <Pressable
            onPress={() => setPhotoUri(null)}
            style={[styles.secondaryButton, processing && styles.buttonDisabled]}
            disabled={processing}
          >
            <Ionicons name="refresh" size={18} color="#203B61" />
            <Text style={styles.secondaryButtonText}>ถ่ายใหม่</Text>
          </Pressable>

          <Pressable
            onPress={savePhoto}
            style={[styles.primaryButton, (processing || saved) && styles.buttonDisabled]}
            disabled={processing || saved}
          >
            {processing ? (
              <ActivityIndicator color="#FFF9F1" size="small" />
            ) : (
              <>
                <Ionicons name={saved ? 'checkmark-circle' : 'download-outline'} size={18} color="#FFF9F1" />
                <Text style={styles.primaryButtonText}>{saved ? 'บันทึกแล้ว' : 'บันทึกลงเครื่อง'}</Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Camera Live View
  return (
    <View style={styles.screen}>
      <CameraView ref={cameraRef} facing={facing} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>📷 กล้อง & ฟิลเตอร์</Text>
          </View>
          <Pressable
            onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
            style={styles.iconCircle}
          >
            <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          {/* Filters row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map((item) => {
              const active = item.id === filter;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFilter(item.id)}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Ionicons name={item.icon} size={15} color={active ? '#FF6B43' : '#FFF'} />
                  <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                    {item.name} ({item.hint})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Shutter button */}
          <View style={styles.shutterRow}>
            <Pressable
              onPress={capturePhoto}
              style={({ pressed }) => [styles.shutterOuter, pressed && styles.shutterPressed]}
              disabled={processing}
            >
              <View style={styles.shutterInner}>
                {processing ? (
                  <ActivityIndicator color="#FF6B43" size="small" />
                ) : (
                  <View style={styles.shutterDot} />
                )}
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  tag: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    paddingBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingTop: 16,
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
  },
  filterPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FF6B43',
  },
  shutterRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterPressed: {
    transform: [{ scale: 0.95 }],
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B43',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  previewScreen: {
    flex: 1,
    backgroundColor: '#FFF6E8',
    paddingHorizontal: 20,
    paddingTop: 10,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  previewCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginTop: 10,
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewFilterBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  filterChipActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF6B43',
  },
  filterName: {
    fontSize: 12,
    color: '#687076',
    fontWeight: '600',
  },
  filterNameActive: {
    color: '#FF6B43',
    fontWeight: '700',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B43',
    paddingVertical: 14,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: '#FFF9F1',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#203B61',
    paddingVertical: 14,
    borderRadius: 16,
  },
  secondaryButtonText: {
    color: '#203B61',
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: '#FFF6E8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  permissionArt: {
    marginBottom: 24,
  },
  cameraCard: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#FFE3D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionEyebrow: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF6B43',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#203B61',
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionBody: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF6E8',
  },
});
