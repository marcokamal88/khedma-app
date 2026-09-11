import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { useAuth } from '../../hooks/useAuth';
import { dashboardApi } from '../../api/dashboard.api';
import AppHeader from '../../components/AppHeader';
import { typography, spacing, shadows } from '../../theme';

const NAVY = '#192f5f';
const CREAM = '#f7f4ed';
const CHARCOAL = '#1c1c1c';
const MUTED = '#5f5f5d';

export default function SectorLeaderDashboard({ navigation }: any) {
  const { t } = useLocale();
  const { activeContext } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await dashboardApi.sectorLeaderStats();
      setStats(res.data);
    } catch {
      setStats({ totalServices: 0, totalStudents: 0, averageAttendance: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
          <View style={styles.contextCard}>
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel} numberOfLines={1}>
                {activeContext?.displayLabel || t('roles.sectorLeader')}
              </Text>
            </View>
          </View>
        </AppHeader>

        <View style={styles.content}>
          <View style={styles.metricsGrid}>
            <MetricCard value={`${stats?.totalServices ?? 0}`} label={t('home.services')} bgColor="#e8f5e9" />
            <MetricCard value={`${stats?.totalStudents ?? 0}`} label={t('home.students')} bgColor="#fff3e0" />
            <MetricCard value={`${stats?.averageAttendance ?? 0}%`} label={t('home.attendanceRate')} bgColor="#e3f2fd" />
          </View>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: NAVY },
  scroll: { flex: 1 },
  contextCard: {
    backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', padding: 14,
  },
  contextRow: { flexDirection: 'row', alignItems: 'center' },
  contextLabel: { ...typography.cardTitle, color: '#ffffff', fontWeight: '700', flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  metricCard: {
    width: '48%', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#eceae4', ...shadows.card, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  metricIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  metricIcon: { fontSize: 20, color: NAVY },
  metricValue: { ...typography.sectionHeading, fontSize: 28, color: NAVY, fontWeight: '800', marginBottom: 2 },
  metricLabel: { ...typography.caption, color: MUTED },
});
