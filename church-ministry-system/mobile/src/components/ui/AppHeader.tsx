import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: { icon: string; onPress: () => void };
  style?: ViewStyle;
}

const BACK_ICON = '\u2039';
const RIGHT_ICONS: Record<string, string> = {
  search: '\u2315',
  settings: '\u2699',
  more: '\u22EF',
  close: '\u2715',
};

export function AppHeader({ title, onBack, rightAction, style }: AppHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.side}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.icon}>{BACK_ICON}</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.side}>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.actionBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.icon}>{RIGHT_ICONS[rightAction.icon] || rightAction.icon}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  side: { width: 44, alignItems: 'flex-start' },
  title: {
    ...typography.subHeading,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  backBtn: { padding: spacing.xxs, borderRadius: borderRadius.md },
  actionBtn: { padding: spacing.xxs, borderRadius: borderRadius.md, alignSelf: 'flex-end' },
  icon: { fontSize: 24, color: colors.charcoal, lineHeight: 26 },
});
