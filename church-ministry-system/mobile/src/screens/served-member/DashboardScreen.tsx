import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useLocale } from '../../hooks/useLocale';
import { useAuth } from '../../hooks/useAuth';
import { dashboardApi } from '../../api/dashboard.api';
import { typography, spacing } from '../../theme';

export default function ServedMemberDashboard() {
  const { t } = useLocale();
  const { logout } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          dashboardApi.memberStats(),
          dashboardApi.memberTasks(),
        ]);
        setStats(statsRes.data);
        setTasks(tasksRes.data || []);
      } catch (e) {
        console.error('Failed to load dashboard:', e);
        setStats({ myPoints: 0, openTasks: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{t('home.welcomeBack')}</Text>
        <Text style={styles.userName}>{user?.fullName}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>{'\u2605'}</Text>
            <Text style={styles.statNumber}>{stats?.myPoints ?? 0}</Text>
            <Text style={styles.statLabel}>{t('home.myPoints')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>{'\u2611'}</Text>
            <Text style={styles.statNumber}>{stats?.openTasks ?? 0}</Text>
            <Text style={styles.statLabel}>{t('home.openTasks')}</Text>
          </View>
        </View>

        {tasks.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.myTasks')}</Text>
            </View>
            {tasks.map((task: any) => (
              <View key={task.id} style={styles.taskItem}>
                <Text style={styles.taskPercent}>{task.progress}%</Text>
                <View style={styles.taskBody}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                </View>
                <Text style={styles.taskCheckIcon}>{'\u2611'}</Text>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    backgroundColor: '#192f5f',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xl,
  },
  greeting: { ...typography.body, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  userName: { ...typography.subHeading, color: '#ffffff' },
  content: { padding: spacing.lg },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f7f4ed',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eceae4',
    padding: spacing.md,
    alignItems: 'center',
  },
  statIcon: { fontSize: 24, marginBottom: spacing.xs },
  statNumber: {
    ...typography.sectionHeading,
    fontSize: 26,
    color: '#1f2d56',
    fontWeight: '700',
  },
  statLabel: { ...typography.caption, color: '#5f5f5d', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.cardTitle, color: '#1c1c1c' },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fcfbf8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eceae4',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  taskPercent: {
    ...typography.caption,
    color: '#1f2d56',
    fontWeight: '700',
    fontSize: 13,
    marginRight: spacing.md,
  },
  taskBody: { flex: 1 },
  taskTitle: { ...typography.body, color: '#1c1c1c' },
  taskCheckIcon: { fontSize: 18, color: '#9e9e9e' },
});
