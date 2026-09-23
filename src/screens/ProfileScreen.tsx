import React from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

const PROFILE = {
  avatar:
    'https://scontent-bkk1-1.xx.fbcdn.net/v/t39.30808-6/632091107_2106751230156226_3511384664420311862_n.jpg?stp=dst-jpg_tt6&cstp=mx960x960&ctp=s960x960&_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=nr5QFmoKCLsQ7kNvwEikggu&_nc_oc=Adr4FRh2rZ_do1P5nITx8TXL1YQo5i7RsaIXgtApuHayuKzvbShvznZVOfN60y59DX4&_nc_zt=23&_nc_ht=scontent-bkk1-1.xx&_nc_gid=c1Zfg5826IX1E8hRQ6TjhQ&_nc_ss=7c2a8&oh=00_AQCq_uJ8M_iIOtlnTAlnEkVjBpuXMKtktfvaT3wGBAmq0w&oe=6A5397AD',
  firstName: 'ณัฐพล',
  lastName: 'พินิจลึก',
  studentId: '663450182-2',
  program: 'วิทยาการคอมพิวเตอร์และสารสนเทศ คณะสหวิทยาการ',
  email: 'nutthaphon.p@kkumail.com',
  facebook: 'https://www.facebook.com/nutthaphon.np',
  instagram: 'https://www.instagram.com/van_bastenez/',
  github: 'https://github.com/avd2547-hash',
};

export default function ProfileScreen() {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Header background */}
        <View style={styles.headerBg}>
          <Text style={styles.headerLabel}>ข้อมูลผู้พัฒนาแอป</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: PROFILE.avatar }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
        </View>

        {/* Name & info card */}
        <View style={styles.card}>
          <Text style={styles.name}>
            {PROFILE.firstName} {PROFILE.lastName}
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>รหัสนักศึกษา</Text>
            <Text style={styles.infoValue}>{PROFILE.studentId}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>หลักสูตร</Text>
            <Text style={[styles.infoValue, styles.infoValueMultiline]}>
              {PROFILE.program}
            </Text>
          </View>
        </View>

        {/* Project integration note */}
        <View style={styles.projectCard}>
          <Text style={styles.projectTitle}>📦 โครงงานรวม 4 ฟีเจอร์ (All-in-One)</Text>
          <View style={styles.projectItem}>
            <Text style={styles.projectItemDot}>•</Text>
            <Text style={styles.projectItemText}>🗺️ Udon POI Guide — แผนที่สถานที่สำคัญ 10 แห่ง</Text>
          </View>
          <View style={styles.projectItem}>
            <Text style={styles.projectItemDot}>•</Text>
            <Text style={styles.projectItemText}>📷 Prism Camera — กล้องถ่ายภาพพร้อมฟิลเตอร์ Natural/Mono/Pop</Text>
          </View>
          <View style={styles.projectItem}>
            <Text style={styles.projectItemDot}>•</Text>
            <Text style={styles.projectItemText}>⚡ Pokédex — ค้นหา สารานุกรมโปเกมอน และบันทึกรายการโปรด</Text>
          </View>
          <View style={styles.projectItem}>
            <Text style={styles.projectItemDot}>•</Text>
            <Text style={styles.projectItemText}>👤 Developer Profile — ประวัติและช่องทางการติดต่อ</Text>
          </View>
        </View>

        {/* Contact buttons */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>ช่องทางการติดต่อ</Text>

          <Pressable
            style={({ pressed }) => [
              styles.contactButton,
              styles.emailButton,
              pressed && styles.pressed,
            ]}
            onPress={() => openLink(`mailto:${PROFILE.email}`)}
          >
            <Ionicons name="mail" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.contactButtonText}>{PROFILE.email}</Text>
          </Pressable>

          <View style={styles.socialRow}>
            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                { backgroundColor: '#1877F2' },
                pressed && styles.pressed,
              ]}
              onPress={() => openLink(PROFILE.facebook)}
            >
              <Ionicons name="logo-facebook" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.socialText}>Facebook</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                { backgroundColor: '#E1306C' },
                pressed && styles.pressed,
              ]}
              onPress={() => openLink(PROFILE.instagram)}
            >
              <Ionicons name="logo-instagram" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.socialText}>Instagram</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.contactButton,
              styles.githubButton,
              pressed && styles.pressed,
            ]}
            onPress={() => openLink(PROFILE.github)}
          >
            <Ionicons name="logo-github" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.contactButtonText}>GitHub</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const AVATAR_SIZE = 130;
const ACCENT = '#B75B3E';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F1E7',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  headerBg: {
    width: '100%',
    height: 140,
    backgroundColor: ACCENT,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: 24,
    alignItems: 'center',
  },
  headerLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  avatarWrapper: {
    marginTop: -65,
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
    }),
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#E5E7EB',
  },
  card: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E8D9C9',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2F2924',
    textAlign: 'center',
    marginBottom: 14,
  },
  infoRow: {
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7B6F65',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#2F2924',
    fontWeight: '600',
  },
  infoValueMultiline: {
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3E2D2',
    marginVertical: 10,
  },
  projectCard: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E8D9C9',
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B75B3E',
    marginBottom: 10,
  },
  projectItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 10,
  },
  projectItemDot: {
    marginRight: 6,
    color: '#7B6F65',
  },
  projectItemText: {
    fontSize: 13,
    color: '#4A403A',
    lineHeight: 18,
  },
  contactSection: {
    width: '90%',
    marginTop: 20,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7B6F65',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  emailButton: {
    backgroundColor: ACCENT,
  },
  githubButton: {
    backgroundColor: '#24292E',
  },
  contactButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 13,
  },
  socialText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },
});
