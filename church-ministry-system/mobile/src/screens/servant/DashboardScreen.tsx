import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useLocale } from '../../hooks/useLocale';
import { dashboardApi } from '../../api/dashboard.api';
import { typography, spacing, shadows } from '../../theme';
import AppHeader from '../../components/AppHeader';

const NAVY = '#192f5f';
const NAVY_LIGHT = '#243a6e';
const GOLD = '#d4a843';
const CREAM = '#f7f4ed';
const OFF_WHITE = '#fcfbf8';
const BORDER = '#eceae4';
const CHARCOAL = '#1c1c1c';
const MUTED = '#5f5f5d';

export default function ServantDashboard() {
  const { t } = useLocale();
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
      } catch {
        setStats({ classSize: 0, attendanceRate: 0, openTasks: 0, totalPoints: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        <AppHeader greetingText={t('home.welcomeBack')}>
          <View style={styles.contextCard}>
            <View style={styles.contextCardBody}>
              <TouchableOpacity style={styles.contextSwitchBtn} activeOpacity={0.7}>
                <Text style={styles.contextSwitchIcon}>{'\u21C4'}</Text>
                <Text style={styles.contextSwitchLabel}>{t('home.switch')}</Text>
              </TouchableOpacity>
              <View style={styles.contextInfo}>
                <Text style={styles.contextRole}>{t('roles.servant')}</Text>
                <Text style={styles.contextDetail}>{t('home.classInfo')}</Text>
              </View>
            </View>
          </View>
        </AppHeader>

        <View style={styles.contentSection}>
          <View style={styles.metricsGrid}>
            <MetricCard
              icon={'\u2637'}
              value={`${stats?.attendanceRate ?? 0}%`}
              label={t('home.attendanceRate')}
              bgColor="#e8f5e9"
            />
            <MetricCard
              icon={'\u263A'}
              value={`${stats?.classSize ?? 0}`}
              label={t('home.myClass')}
              bgColor="#fff3e0"
            />
            <MetricCard
              icon={'\u2605'}
              value={`${(stats?.totalPoints ?? 0).toLocaleString()}`}
              label={t('home.points')}
              bgColor="#e3f2fd"
            />
            <MetricCard
              icon={'\u2611'}
              value={`${stats?.openTasks ?? 0}`}
              label={t('home.openTasks')}
              bgColor="#fce4ec"
            />
          </View>

          {todaySessions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('home.today')}</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.sectionLink}>{t('home.open')}</Text>
                </TouchableOpacity>
              </View>
              {todaySessions.map((session: any) => (
                <View key={session.id} style={styles.taskRow}>
                  <View style={styles.taskRowRight}>
                    <View style={styles.taskIconWrap}>
                      <Text style={styles.taskIcon}>{'\u2637'}</Text>
                    </View>
                    <View style={styles.taskTextWrap}>
                      <Text style={styles.taskTitle} numberOfLines={1}>{session.title}</Text>
                      <Text style={styles.taskMeta} numberOfLines={1}>
                        {session.time} - {session.location}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{t('home.due')}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {tasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('home.myTasks')}</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.sectionLink}>{t('home.all')}</Text>
                </TouchableOpacity>
              </View>
              {tasks.map((task: any) => (
                <View key={task.id} style={styles.taskRow}>
                  <View style={styles.taskRowRight}>
                    <View style={styles.taskIconWrap}>
                      <Text style={styles.taskIcon}>{'\u2611'}</Text>
                    </View>
                    <View style={styles.taskTextWrap}>
                      <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                      <Text style={styles.taskMeta} numberOfLines={1}>
                        {task.isOverdue ? t('home.tomorrow') : task.dueDate || ''}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusPill, styles.statusPillProgress]}>
                    <Text style={styles.statusPillProgressText}>{task.progress}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function MetricCard({ icon, value, label, bgColor }: { icon: string; value: string; label: string; bgColor: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconWrap, { backgroundColor: bgColor }]}>
        <Text style={styles.metricIcon}>{icon}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: NAVY },
  scroll: { flex: 1 },

  contextCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 14,
  },
  contextCardBody: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contextInfo: { flex: 1, marginRight: 12 },
  contextRole: { ...typography.cardTitle, color: '#ffffff', fontWeight: '700' },
  contextDetail: { ...typography.caption, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  contextSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  contextSwitchIcon: { fontSize: 14, color: CHARCOAL, marginRight: 4 },
  contextSwitchLabel: { ...typography.buttonSmall, color: CHARCOAL, fontWeight: '700' },

  contentSection: { paddingHorizontal: 16, paddingTop: 16 },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    ...shadows.card,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  metricIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricIcon: { fontSize: 20, color: NAVY },
  metricValue: {
    ...typography.sectionHeading,
    fontSize: 28,
    color: NAVY,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: { ...typography.caption, color: MUTED },

  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { ...typography.cardTitle, color: CHARCOAL },
  sectionLink: { ...typography.buttonSmall, color: NAVY, fontWeight: '600' },

  taskRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: OFF_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 8,
  },
  taskRowRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  taskIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  taskIcon: { fontSize: 16, color: '#ffffff' },
  taskTextWrap: { flex: 1 },
  taskTitle: { ...typography.body, color: CHARCOAL, fontWeight: '600', textAlign: 'right' },
  taskMeta: { ...typography.caption, color: MUTED, marginTop: 2, textAlign: 'right' },
  statusPill: {
    backgroundColor: '#fff3e0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 8,
  },
  statusPillText: { ...typography.caption, color: '#e65100', fontWeight: '700', fontSize: 11 },
  statusPillProgress: { backgroundColor: '#e8f5e9' },
  statusPillProgressText: { ...typography.caption, color: '#2e7d32', fontWeight: '700', fontSize: 11 },
});
