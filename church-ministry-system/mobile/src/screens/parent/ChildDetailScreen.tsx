import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { childrenApi } from '../../api/children.api';
import { useLocale } from '../../hooks/useLocale';
import { AppCard, AppAvatar, AppBadge } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

export default function ChildDetailScreen({ route }: any) {
  const { t } = useLocale();
  const { childId, childName } = route.params || {};
  const [data, setData] = useState<any>({ attendance: null, taio: null, tasks: [], preparations: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [attRes, taioRes, taskRes, prepRes] = await Promise.allSettled([
          childrenApi.getAttendance(childId),
          childrenApi.getTaioBalance(childId),
          childrenApi.getTasks(childId),
          childrenApi.getPreparations(childId),
        ]);
        const extract = (res: any, fallback: any = []) =>
          res?.value?.data?.data || res?.value?.data || fallback;
        setData({
          attendance: extract(attRes, null),
          taio: extract(taioRes, { balance: 0 }),
          tasks: extract(taskRes, []),
          preparations: extract(prepRes, []),
        });
      } catch (err) {
        console.warn('Failed to load child data', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [childId]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.charcoal} /></View>;
  }

  const attendance = Array.isArray(data.attendance) ? data.attendance : [];
  const recentAttendance = attendance.slice(-5).reverse();
  const attendanceRate = attendance.length > 0
    ? Math.round((attendance.filter((a: any) => a.status === 'present').length / attendance.length) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppAvatar name={childName || ''} size={56} />
        <Text style={styles.heading}>{childName}</Text>
      </View>

      <View style={styles.statsRow}>
        <AppCard variant="bordered" style={styles.statBox}>
          <Text style={styles.statValue}>{attendanceRate}%</Text>
          <Text style={styles.statLabel}>{t('attendance.title')}</Text>
        </AppCard>
        <AppCard variant="bordered" style={styles.statBox}>
          <Text style={styles.statValue}>{data.taio?.balance ?? 0}</Text>
          <Text style={styles.statLabel}>{t('tabs.taio')}</Text>
        </AppCard>
        <AppCard variant="bordered" style={styles.statBox}>
          <Text style={styles.statValue}>{data.tasks.length}</Text>
          <Text style={styles.statLabel}>{t('tabs.tasks')}</Text>
        </AppCard>
      </View>

      {recentAttendance.length > 0 && (
        <AppCard variant="bordered" style={styles.section}>
          <Text style={styles.sectionTitle}>{t('attendance.recent')}</Text>
          {recentAttendance.map((a: any, i: number) => (
            <View key={i} style={styles.row}>
              <Text style={styles.rowText}>{a.sessionDate || a.date || '---'}</Text>
              <AppBadge
                label={a.status === 'present' ? '✓' : '✗'}
                variant={a.status === 'present' ? 'success' : 'error'}
              />
            </View>
          ))}
        </AppCard>
      )}

      {data.tasks.length > 0 && (
        <AppCard variant="bordered" style={styles.section}>
          <Text style={styles.sectionTitle}>{t('tasks.assigned')}</Text>
          {data.tasks.slice(0, 5).map((task: any, i: number) => (
            <View key={i} style={styles.row}>
              <Text style={styles.rowText}>{task.title || task.name || '---'}</Text>
              <AppBadge
                label={task.status === 'completed' ? '✓' : '○'}
                variant={task.status === 'completed' ? 'success' : 'warning'}
              />
            </View>
          ))}
        </AppCard>
      )}

      {data.preparations.length > 0 && (
        <AppCard variant="bordered" style={styles.section}>
          <Text style={styles.sectionTitle}>{t('preparation.title')}</Text>
          {data.preparations.slice(0, 3).map((prep: any, i: number) => (
            <View key={i} style={styles.row}>
              <Text style={styles.rowText}>{prep.lessonTitle || prep.title || '---'}</Text>
              <AppBadge
                label={prep.status || 'pending'}
                variant="info"
              />
            </View>
          ))}
        </AppCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  heading: { ...typography.sectionHeading, color: colors.textPrimary, marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.cardTitle, color: colors.info },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.cardTitle, color: colors.textPrimary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { ...typography.body, color: colors.textPrimary, flex: 1 },
});
