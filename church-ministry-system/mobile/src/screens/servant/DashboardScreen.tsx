import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useLocale } from '../../hooks/useLocale';
import { useAuth } from '../../hooks/useAuth';
import { dashboardApi } from '../../api/dashboard.api';
import { typography, spacing } from '../../theme';

export default function ServantDashboard() {
  const { t } = useLocale();
  const { logout } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);
  const [stats, setStats] = useState<any>(null);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, todayRes, tasksRes] = await Promise.all([
          dashboardApi.servantStats(),
          dashboardApi.servantToday(),
          dashboardApi.servantTasks(),
        ]);
        setStats(statsRes.data);
        setTodaySessions(todayRes.data || []);
        setTasks(tasksRes.data || []);
      } catch (e) {
        console.error('Failed to load dashboard:', e);
        setStats({ classSize: 0, attendanceRate: 0, openTasks: 0, totalPoints: 0 });
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
        <View style={styles.roleCard}>
          <View style={styles.roleInfo}>
            <Text style={styles.roleTitle}>{t('roles.servant')}</Text>
            <Text style={styles.roleDetail}>{t('home.classInfo')}</Text>
          </View>
          <TouchableOpacity style={styles.switchBtn} activeOpacity={0.7}>
            <Text style={styles.switchArrow}>{'\u21C4'}</Text>
            <Text style={styles.switchText}>{t('home.switch')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>{'\u263A'}</Text>
            <Text style={styles.statNumber}>{stats?.classSize ?? 0}</Text>
            <Text style={styles.statLabel}>{t('home.myClass')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>{'\u2637'}</Text>
            <Text style={styles.statNumber}>{stats?.attendanceRate ?? 0}%</Text>
            <Text style={styles.statLabel}>{t('home.attendanceRate')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>{'\u2611'}</Text>
            <Text style={styles.statNumber}>{stats?.openTasks ?? 0}</Text>
            <Text style={styles.statLabel}>{t('home.openTasks')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>{'\u2605'}</Text>
            <Text style={styles.statNumber}>{(stats?.totalPoints ?? 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>{t('home.points')}</Text>
          </View>
        </View>

        {todaySessions.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.today')}</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.sectionAction}>{t('home.open')}</Text>
              </TouchableOpacity>
            </View>
            {todaySessions.map((session: any) => (
              <View key={session.id} style={styles.taskCard}>
                <View style={styles.taskCardLeft}>
                  <Text style={styles.taskCardIcon}>{'\u2637'}</Text>
                </View>
                <View style={styles.taskCardBody}>
                  <Text style={styles.taskCardTitle}>{session.title}</Text>
                  <Text style={styles.taskCardMeta}>{session.time} - {session.location}</Text>
                </View>
                <View style={styles.taskCardRight}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{t('home.due')}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {tasks.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.myTasks')}</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.sectionAction}>{t('home.all')}</Text>
              </TouchableOpacity>
            </View>
            {tasks.map((task: any) => (
              <View key={task.id} style={styles.taskItem}>
                <Text style={styles.taskPercent}>{task.progress}%</Text>
                <View style={styles.taskBody}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDue}>
                    {task.isOverdue ? t('home.tomorrow') : task.dueDate || ''}
                  </Text>
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
    paddingBottom: spacing.lg,
  },
  greeting: { ...typography.body, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  userName: { ...typography.subHeading, color: '#ffffff', marginBottom: spacing.lg },
  roleCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleInfo: { flex: 1 },
  roleTitle: { ...typography.cardTitle, color: '#ffffff' },
  roleDetail: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  switchArrow: { fontSize: 14, color: '#ffffff', marginRight: 4 },
  switchText: { ...typography.caption, color: '#ffffff', fontWeight: '600' },
  content: { padding: spacing.lg },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '48%',
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
    marginTop: spacing.sm,
  },
  sectionTitle: { ...typography.cardTitle, color: '#1c1c1c' },
  sectionAction: { ...typography.caption, color: '#1f2d56', fontWeight: '600' },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fcfbf8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eceae4',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  taskCardLeft: { marginRight: spacing.md },
  taskCardIcon: { fontSize: 24, color: '#1f2d56' },
  taskCardBody: { flex: 1 },
  taskCardTitle: { ...typography.body, color: '#1c1c1c', fontWeight: '600' },
  taskCardMeta: { ...typography.caption, color: '#5f5f5d', marginTop: 2 },
  taskCardRight: { marginLeft: spacing.sm },
  statusBadge: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusText: { ...typography.caption, color: '#e65100', fontWeight: '600', fontSize: 11 },
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
  taskDue: { ...typography.caption, color: '#5f5f5d', marginTop: 2 },
  taskCheckIcon: { fontSize: 18, color: '#9e9e9e' },
});
