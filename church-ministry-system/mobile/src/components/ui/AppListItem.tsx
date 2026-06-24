import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

const LEFT_ICONS: Record<string, string> = {
  user: '\u263A',
  users: '\u263A\u263A',
  calendar: '\u2637',
  check: '\u2713',
  file: '\u2702',
  message: '\u2709',
  phone: '\u260E',
  notification: '\u2630',
  default: '\u25CF',
};

interface AppListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: string;
  rightIcon?: string;
  onPress?: () => void;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AppListItem({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onPress,
  children,
  style,
}: AppListItemProps) {
  const content = (
    <View style={[styles.container, style]}>
      {leftIcon && (
        <View style={styles.leftIcon}>
          <Text style={styles.leftIconText}>{LEFT_ICONS[leftIcon] || LEFT_ICONS.default}</Text>
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>}
        {children}
      </View>
      {rightIcon && (
        <Text style={styles.rightArrow}>{'\u203A'}</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.charcoal4,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: spacing.sm,
  },
  leftIconText: { fontSize: 16 },
  textContainer: { flex: 1 },
  title: { ...typography.body, color: colors.textPrimary, fontWeight: '500' },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  rightArrow: { fontSize: 20, color: colors.mutedGray },
});
