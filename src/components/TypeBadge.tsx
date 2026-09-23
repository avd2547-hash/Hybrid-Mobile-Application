import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { TYPE_COLORS, TYPE_NAMES_TH } from '../constants/Pokemon';

interface TypeBadgeProps {
  type: string;
  onPress?: () => void;
  size?: 'small' | 'medium';
}

export default function TypeBadge({
  type,
  onPress,
  size = 'medium',
}: TypeBadgeProps) {
  const backgroundColor = TYPE_COLORS[type] || '#999';
  const label =
    TYPE_NAMES_TH[type] || type.charAt(0).toUpperCase() + type.slice(1);

  const isSmall = size === 'small';

  const badgeContent = (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          paddingHorizontal: isSmall ? 8 : 14,
          paddingVertical: isSmall ? 3 : 6,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: isSmall ? 10 : 13 },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {badgeContent}
      </TouchableOpacity>
    );
  }

  return badgeContent;
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
