import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useLocale } from '../../hooks/useLocale';
import { useAuth } from '../../hooks/useAuth';
import { AppButton, AppCard } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

export default function ServedMemberDashboard() {
  const { t } = useLocale();
  const { logout } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{t('home.greeting')}{user?.fullName}</Text>
      </View>
      <AppCard variant="bordered" style={styles.card}>
        <Text style={styles.cardTitle}>{t('home.upcomingTasks')}</Text>
        <Text style={styles.cardText}>{t('home.noTasks')}</Text>
      </AppCard>
      <AppCard variant="bordered" style={styles.card}>
        <Text style={styles.cardTitle}>{t('home.myPoints')}</Text>
        <Text style={styles.points}>0</Text>
      </AppCard>
      <AppButton
        title={t('auth.logout')}
        onPress={logout}
        variant="danger"
        style={styles.logoutBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.success,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  greeting: { ...typography.sectionHeading, color: colors.offWhite },
  card: { margin: spacing.md },
  cardTitle: { ...typography.cardTitle, color: colors.textPrimary, marginBottom: spacing.sm },
  cardText: { ...typography.body, color: colors.textSecondary },
  points: { ...typography.displayHero, color: colors.success },
  logoutBtn: { margin: spacing.md },
});
