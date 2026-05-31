import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type BadgeVariant = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'default' | 'green' | 'blue';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#D1FAE5', text: '#065F46' },
  completed: { bg: '#DBEAFE', text: '#1E40AF' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
  default: { bg: '#F3F4F6', text: '#374151' },
  green: { bg: '#D1FAE5', text: '#065F46' },
  blue: { bg: '#DBEAFE', text: '#1E40AF' },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', style }) => {
  const colors = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
