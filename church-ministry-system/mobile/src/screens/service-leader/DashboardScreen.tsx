import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { useAuth } from '../../hooks/useAuth';
import { dashboardApi } from '../../api/dashboard.api';
import AppHeader from '../../components/AppHeader';
import ContextCard from '../../components/ContextCard';
import { typography, spacing, shadows } from '../../theme';

const NAVY = '#192f5f';
const GOLD = '#d4a843';
const CREAM = '#f7f4ed';
const CHARCOAL = '#1c1c1c';
const MUTED = '#5f5f5d';

export default function ServiceLeaderDashboard({ navigation }: any) {
  const { t } = useLocale();
  const { activeContext, switchContext } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const revalidated = useRef(false);
  const serviceId = activeContext?.scope?.serviceId;

  const fetchStats = useCallback(async (skipRevalidate = false) => {
    try {
      if (!skipRevalidate && !revalidated.current && activeContext?.role && activeContext?.scope) {
        revalidated.current = true;
        await switchContext({ role: activeContext.role, scope: activeContext.scope });
      }
      const res = await dashboardApi.serviceLeaderStats();
      setStats(res.data);
    } catch {
      setStats({ totalStudents: 0, totalServants: 0, upcomingEvents: 0, studentsByGender: { male: 0, female: 0, unknown: 0 }, servantsByGender: { male: 0, female: 0, unknown: 0 }, studentsByAge: { avgAge: null, brackets: { '<12': 0, '12-14': 0, '15-17': 0, '18+': 0, unknown: 0 } }, servantsByAge: { avgAge: null, brackets: { '<12': 0, '12-14': 0, '15-17': 0, '18+': 0, unknown: 0 } } });
    } finally {
      setLoading(false);
    }
  }, [activeContext?.role, activeContext?.scope, serviceId, switchContext]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchStats(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#192f5f']} tintColor="#192f5f" />}>
        <AppHeader greetingText={t('home.welcomeBack')}>
          <ContextCard defaultRole="service_leader" />
        </AppHeader>

        <View style={styles.content}>
          <View style={styles.metricsGrid}>
            <MetricCard value={`${stats?.totalStudents ?? 0}`} label={t('home.students')} bgColor="#e3f2fd" />
            <MetricCard value={`${stats?.totalServants ?? 0}`} label={t('home.servants')} bgColor="#e8f5e9" />
            <MetricCard value={`${stats?.upcomingEvents ?? 0}`} label={t('home.upcomingEvents')} bgColor="#fff3e0" />
          </View>
          <BreakdownCard title={t('home.studentsByGender')} byGender={stats?.studentsByGender} byAge={stats?.studentsByAge} t={t} />
          <BreakdownCard title={t('home.servantsByGender')} byGender={stats?.servantsByGender} byAge={stats?.servantsByAge} t={t} />

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ServantManagement')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>{'\u2699'}</Text>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>{t('servantManagement.title')}</Text>
            </View>
            <Text style={styles.actionChevron}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ClassManagement')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>{'\u25A3'}</Text>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>{t('classManagement.title')}</Text>
            </View>
            <Text style={styles.actionChevron}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('StudentsManagement')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>{'\u263A'}</Text>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>{t('studentsManagement.title') || 'إدارة المخدومين'}</Text>
            </View>
            <Text style={styles.actionChevron}>{'\u203A'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function MetricCard({ value, label, bgColor }: { value: string; label: string; bgColor: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconWrap, { backgroundColor: bgColor }]}>
        <Text style={styles.metricIcon}>{'\u2605'}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function BreakdownCard({ title, byGender, byAge, t }: { title: string; byGender: any; byAge: any; t: any }) {
  if (!byGender && !byAge) return null;
  const m = byGender?.male ?? 0;
  const f = byGender?.female ?? 0;
  const u = byGender?.unknown ?? 0;
  const avg = byAge?.avgAge;
  const br = byAge?.brackets;
  return (
    <View style={styles.breakdownCard}>
      <Text style={styles.breakdownTitle}>{title}</Text>
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownPill}>{t('home.male')}: {m}</Text>
        <Text style={styles.breakdownPill}>{t('home.female')}: {f}</Text>
        {u > 0 && <Text style={styles.breakdownPillMuted}>{t('home.unknown')}: {u}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: NAVY },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 20 },
  metricCard: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 16, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#eceae4', ...shadows.card, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  metricIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  metricIcon: { fontSize: 20, color: NAVY },
  metricValue: { ...typography.sectionHeading, fontSize: 28, color: NAVY, fontWeight: '800', marginBottom: 2 },
  metricLabel: { ...typography.caption, color: MUTED },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#eceae4', marginBottom: 12, ...shadows.card,
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  actionIcon: { fontSize: 24, color: NAVY, marginRight: 12 },
  actionTextWrap: { flex: 1 },
  actionTitle: { ...typography.cardTitle, color: NAVY },
  actionSub: { ...typography.caption, color: MUTED, marginTop: 2 },
  actionChevron: { fontSize: 24, color: MUTED, marginLeft: 8 },
  breakdownCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#eceae4', marginBottom: 12, ...shadows.card, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  breakdownTitle: { ...typography.cardTitle, color: NAVY, fontSize: 13, marginBottom: 8 },
  breakdownRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  breakdownPill: { ...typography.caption, color: NAVY, backgroundColor: '#eef2f7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, overflow: 'hidden' },
  breakdownPillMuted: { ...typography.caption, color: MUTED, backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, overflow: 'hidden' },
  breakdownSmall: { ...typography.caption, color: MUTED, fontSize: 11 },
});
