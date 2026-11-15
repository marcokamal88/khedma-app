import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { useAuth } from '../../hooks/useAuth';
import { churchApi } from '../../api/church.api';
import AppHeader from '../../components/AppHeader';
import { typography, shadows } from '../../theme';

const NAVY = '#192f5f';
const CREAM = '#f7f4ed';
const CHARCOAL = '#1c1c1c';
const MUTED = '#5f5f5d';
const GREEN = '#10b981';
const GOLD = '#d4a843';

export default function SectorLeaderDashboard({ navigation }: any) {
  const { t } = useLocale();
  const { activeContext } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await churchApi.getMySectorOverview();
      setData(res.data);
    } catch (err) {
      console.warn('Failed to load sector overview', err);
      setData(null);
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

  const services = data?.services || [];

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[NAVY]}
            tintColor={NAVY}
          />
        }
      >
        <AppHeader greetingText="مرحباً بك يا أمين القطاع">
          <View style={styles.contextCard}>
            <View style={styles.contextRow}>
              <View style={styles.sectorIconBadge}>
                <Text style={styles.sectorIconText}>{'\u25EB'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contextLabel} numberOfLines={1}>
                  {data?.sector?.name || activeContext?.displayLabel || 'القطاع'}
                </Text>
                <Text style={styles.contextSub}>
                  {data?.sector?.type ? `قطاع ${data?.sector?.type}` : 'إشراف على خدمات ومراحل القطاع'}
                </Text>
              </View>
            </View>
          </View>
        </AppHeader>

        <View style={styles.content}>
          {/* Top 4 Metrics Summary */}
          <Text style={styles.sectionHeader}>ملخص القطاع</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              value={`${data?.totalServices ?? services.length}`}
              label="الخدمات"
              icon={'\u25A1'}
              bgColor="#e8f5e9"
            />
            <MetricCard
              value={`${data?.totalServants ?? 0}`}
              label="الخدام"
              icon={'\u2606'}
              bgColor="#f3e8ff"
            />
            <MetricCard
              value={`${data?.totalStudents ?? 0}`}
              label="المخدومين"
              icon={'\u263A'}
              bgColor="#fff3e0"
            />
            <MetricCard
              value={`${data?.averageAttendance ?? 0}%`}
              label="متوسط الحضور"
              icon={'\u2637'}
              bgColor="#e3f2fd"
            />
          </View>

          {/* Quick Action Navigation */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('SectorManagement')}
            >
              <Text style={styles.actionBtnIcon}>{'\u25EB'}</Text>
              <Text style={styles.actionBtnText}>إدارة وتوزيع الخدام</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#fdf8ec', borderColor: '#fef3c7' }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Reports')}
            >
              <Text style={[styles.actionBtnIcon, { color: GOLD }]}>{'\u25C8'}</Text>
              <Text style={[styles.actionBtnText, { color: '#92400e' }]}>تقارير القطاع</Text>
            </TouchableOpacity>
          </View>

          {/* Services Breakdown Cards */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeader}>خدمات ومراحل القطاع ({services.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SectorManagement')}>
              <Text style={styles.viewAllText}>إدارة الكل ←</Text>
            </TouchableOpacity>
          </View>

          {services.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>لم يتم تسجيل خدمات تابعة لهذا القطاع بعد</Text>
            </View>
          ) : (
            services.map((service: any) => {
              const serviceLeader = service.leaders?.find((l: any) => l.role === 'service_leader');
              const rate = service.attendanceRate || 0;

              return (
                <View key={service.id} style={styles.serviceItemCard}>
                  <View style={styles.serviceHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceItemTitle}>{service.name}</Text>
                      {service.description ? (
                        <Text style={styles.serviceItemSubtitle}>{service.description}</Text>
                      ) : null}
                    </View>
                    <View style={styles.attendanceBadge}>
                      <Text style={styles.attendanceBadgeText}>{rate}% حضور</Text>
                    </View>
                  </View>

                  {/* Attendance Progress Bar */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${Math.min(100, Math.max(5, rate))}%`,
                          backgroundColor: rate >= 75 ? GREEN : rate >= 50 ? GOLD : '#ef4444',
                        },
                      ]}
                    />
                  </View>

                  {/* Service Leader Info */}
                  <View style={styles.serviceLeaderInfo}>
                    <Text style={styles.leaderRoleLabel}>أمين المرحلة:</Text>
                    <Text style={styles.leaderNameText}>
                      {serviceLeader?.fullName || 'غير محدد'}
                    </Text>
                    {serviceLeader?.phone ? (
                      <Text style={styles.leaderPhoneText}>({serviceLeader.phone})</Text>
                    ) : null}
                  </View>

                  {/* Micro stats and Manage Button */}
                  <View style={styles.serviceFooterRow}>
                    <View style={styles.microStats}>
                      <Text style={styles.microStatItem}>
                        <Text style={styles.bold}>{service.classesCount || 0}</Text> فصول
                      </Text>
                      <Text style={styles.microStatDivider}>•</Text>
                      <Text style={styles.microStatItem}>
                        <Text style={styles.bold}>{service.servantsCount || 0}</Text> خدام
                      </Text>
                      <Text style={styles.microStatDivider}>•</Text>
                      <Text style={styles.microStatItem}>
                        <Text style={styles.bold}>{service.studentsCount || 0}</Text> مخدومين
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.manageBtn}
                      onPress={() => navigation.navigate('SectorManagement')}
                    >
                      <Text style={styles.manageBtnText}>إدارة</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function MetricCard({
  value,
  label,
  icon,
  bgColor,
}: {
  value: string;
  label: string;
  icon: string;
  bgColor: string;
}) {
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
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    padding: 12,
  },
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectorIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectorIconText: { fontSize: 20, color: '#ffffff' },
  contextLabel: { ...typography.cardTitle, color: '#ffffff', fontWeight: '800', fontSize: 16 },
  contextSub: { fontSize: 12, color: 'rgba(255,255,255,0.80)', marginTop: 2 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  sectionHeader: { fontSize: 15, fontWeight: '800', color: NAVY, marginBottom: 10 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 10 },
  viewAllText: { fontSize: 13, color: NAVY, fontWeight: '700' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginBottom: 16 },
  metricCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eceae4',
    ...shadows.card,
  },
  metricIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  metricIcon: { fontSize: 18, color: NAVY },
  metricValue: { ...typography.sectionHeading, fontSize: 22, color: NAVY, fontWeight: '800', marginBottom: 1 },
  metricLabel: { ...typography.caption, color: MUTED, fontSize: 11 },
  quickActionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    ...shadows.card,
  },
  actionBtnIcon: { fontSize: 16, color: NAVY },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: NAVY },
  serviceItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eceae4',
    ...shadows.card,
    marginBottom: 10,
  },
  serviceHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  serviceItemTitle: { fontSize: 15, fontWeight: '700', color: NAVY },
  serviceItemSubtitle: { fontSize: 11, color: MUTED, marginTop: 1 },
  attendanceBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  attendanceBadgeText: { fontSize: 11, fontWeight: '700', color: GREEN },
  progressTrack: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginVertical: 10, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  serviceLeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  leaderRoleLabel: { fontSize: 12, color: MUTED },
  leaderNameText: { fontSize: 13, fontWeight: '700', color: CHARCOAL },
  leaderPhoneText: { fontSize: 11, color: MUTED },
  serviceFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  microStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  microStatItem: { fontSize: 12, color: MUTED },
  microStatDivider: { fontSize: 12, color: '#cbd5e1' },
  bold: { fontWeight: '700', color: CHARCOAL },
  manageBtn: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  manageBtnText: { fontSize: 11, fontWeight: '700', color: NAVY },
  emptyCard: { backgroundColor: '#ffffff', padding: 24, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: MUTED, fontSize: 13 },
});
