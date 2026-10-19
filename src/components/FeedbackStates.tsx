import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/Colors';

// Week 3: Reusable Empty/Error/Loading states

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Text style={styles.icon}>🗓️</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          style={styles.button}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container} accessibilityLiveRegion="assertive">
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>เกิดข้อผิดพลาด</Text>
      <Text style={styles.subtitle}>{message}</Text>
      {onRetry ? (
        <Pressable
          style={[styles.button, styles.retryButton]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="ลองอีกครั้ง"
        >
          <Text style={styles.buttonText}>ลองอีกครั้ง</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function LoadingState({ message = 'กำลังโหลด...' }: { message?: string }) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.subtitle}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 18, fontWeight: '700', color: Theme.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Theme.textMuted, textAlign: 'center', lineHeight: 20 },
  button: {
    marginTop: 8,
    backgroundColor: Theme.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButton: { backgroundColor: Theme.primarySoft },
  buttonText: { color: Theme.onPrimary, fontWeight: '700', fontSize: 14 },
});
