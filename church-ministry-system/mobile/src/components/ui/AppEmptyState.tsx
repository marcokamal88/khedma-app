import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, typography, spacing } from '../../theme';

const ICONS: Record<string, string> = {
  inbox: '\u2610',
  calendar: '\u2637',
  'check-square': '\u2611',
  bell: '\u2630',
  'file-text': '\u2702',
  users: '\u263A\u263A',
  'shopping-bag': '\u2693',
  award: '\u2606',
  'check-circle': '\u2714',
  book: '\u2702',
  activity: '\u2692',
  'credit-card': '\u2713',
  'document-text': '\u270E',
  people: '\u263A\u263A',
  trophy: '\u2605',
  'calendar-outline': '\u2637',
  'checkbox-outline': '\u2610',
  'notifications-outline': '\u2630',
  'document-text-outline': '\u2702',
  'people-outline': '\u263A\u263A',
  'storefront-outline': '\u2693',
  'trophy-outline': '\u2606',
  'checkmark-done-outline': '\u2714',
  'book-outline': '\u2702',
  'fitness-outline': '\u2692',
  'wallet-outline': '\u2713',
  default: '\u2610',
};

interface AppEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
}

export function AppEmptyState({ icon = 'inbox', title, description, style }: AppEmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{ICONS[icon] || ICONS.default}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  icon: { fontSize: 48, color: colors.mutedGray },
  title: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
