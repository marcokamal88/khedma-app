import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useActiveContext } from '../../hooks/useActiveContext';
import { useLocale } from '../../hooks/useLocale';
import { useAuth } from '../../hooks/useAuth';
import { AppButton, AppCard, AppAvatar } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function ServantDashboard() {
  const { t, isRTL } = useLocale();
  const { logout } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);
  const { serviceId, role } = useActiveContext();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>{t('home.greeting')}{user?.fullName}</Text>
        <Text style={styles.role}>{t('app.activeRole')}{role}</Text>
      </View>
      <AppCard variant="bordered" style={styles.card}>
        <Text style={styles.cardTitle}>{t('home.quickActions')}</Text>
        <Text style={styles.cardBody}>{t('home.recentActivity')}</Text>
      </AppCard>
      <AppButton
        title={t('auth.logout')}
        onPress={logout}
        variant="ghost"
        size="lg"
        style={styles.logoutBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.xl },
  greetingSection: { marginBottom: spacing.xxl },
  greeting: { ...typography.sectionHeading, color: colors.textPrimary },
  role: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    textTransform: 'capitalize',
  },
  card: { marginBottom: spacing.md },
  cardTitle: { ...typography.cardTitle, color: colors.textPrimary, marginBottom: spacing.sm },
  cardBody: { ...typography.body, color: colors.textSecondary },
  logoutBtn: { marginTop: spacing.xl },
});
