import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, TextInput, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocale } from '../../hooks/useLocale';
import { useActiveContext } from '../../hooks/useActiveContext';
import { AppCard, AppBadge, AppButton } from '../../components/ui';
import { colors, typography, shadows } from '../../theme';
import apiClient from '../../api/client';

const NAVY = colors.navy;
const GOLD = colors.gold;
const CREAM = colors.cream;
const MUTED = colors.mutedGray;

const reportTypes = [
  { key: 'attendance', icon: '📊', color: '#e3f2fd' },
  { key: 'engagement', icon: '🤝', color: '#e8f5e9' },
  { key: 'financial', icon: '💰', color: '#fff3e0' },
  { key: 'taio', icon: '⭐', color: '#fce4ec' },
  { key: 'servant-performance', icon: '🎓', color: '#ede7f6' },
] as const;

export default function ReportsScreen() {
  const { t } = useLocale();
  const { serviceId } = useActiveContext();
  const [report, setReport] = useState<any>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [downloading, setDownloading] = useState(false);

  const loadReport = useCallback(async (type: string) => {
    setActiveType(type);
    setLoading(true);
    try {
      let url = '';
      const params: any = {};
      if (type === 'attendance') { url = '/reports/attendance'; if (serviceId) params.serviceId = serviceId; }
      else if (type === 'engagement') { url = '/reports/engagement'; if (serviceId) params.serviceId = serviceId; }
      else if (type === 'financial') url = '/reports/financial';
      else if (type === 'taio') url = '/reports/taio';
      else if (type === 'servant-performance') { url = '/reports/servant-performance'; if (serviceId) params.serviceId = serviceId; }
      const res: any = await apiClient.get(url, { params });
      setReport({ type, data: res?.data ?? res });
    } catch (e: any) {
      setReport({ type, error: e?.message || t('app.error') });
    } finally { setLoading(false); }
  }, [serviceId, t]);

  const onRefresh = useCallback(async () => {
    if (!activeType) return;
    setRefreshing(true);
    await loadReport(activeType);
    setRefreshing(false);
  }, [activeType, loadReport]);

  const downloadExcel = useCallback(async () => {
    if (!serviceId) { Alert.alert('', t('reports.noService') || 'لا توجد خدمة'); return; }
    setDownloading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const churchId = (await AsyncStorage.getItem('church_id')) || '1';
      const base = (apiClient.defaults.baseURL as string) || `http://${Platform.OS === 'android' ? '10.134.143.23' : 'localhost'}:3000/api/v1`;
      const arabicService = report?.data?.serviceName || 'الخدمة';
      const query = new URLSearchParams({ serviceId: String(serviceId), ...(from.trim() ? { from: from.trim() } : {}), ...(to.trim() ? { to: to.trim() } : {}), ...(token ? { token } : {}), churchId: String(churchId) }).toString();
      const url = `${base}/reports/attendance/excel?${query}`;
      try {
        const FileSystem: any = require('expo-file-system');
        const fileName = `حضور_${arabicService}_${from || 'بداية'}_إلى_${to || 'الآن'}.xlsx`;
        const fileUri = (FileSystem.cacheDirectory || FileSystem.documentDirectory || '') + fileName;
        const dl: any = await FileSystem.downloadAsync(url, fileUri, { headers: { Authorization: token ? `Bearer ${token}` : '', 'X-Church-ID': churchId } });
        if (dl.status === 200) { await Linking.openURL(dl.uri); return; }
      } catch {}
      await Linking.openURL(url);
    } catch (e: any) {
      try {
        const params: any = { serviceId };
        if (from.trim()) params.from = from.trim();
        if (to.trim()) params.to = to.trim();
        await apiClient.get('/reports/attendance/excel', { params, responseType: 'arraybuffer' });
        Alert.alert('', 'تم إنشاء ملف الإكسل — سيُفتح في المتصفح');
      } catch (err: any) {
        Alert.alert('', err?.response?.data?.message || err?.message || t('app.error'));
      }
    } finally { setDownloading(false); }
  }, [serviceId, from, to, t, report]);

  const renderReportContent = () => {
    if (!report) return null;
    const d = report.data;
    if (report.error) return <Text style={styles.errorText}>{report.error}</Text>;
    if (!d) return <Text style={styles.mutedText}>{t('app.noData')}</Text>;

    if (report.type === 'attendance') {
      const s = d.summary || {};
      return (
        <View>
          <View style={styles.statsGrid}>
            <Stat label={t('reports.attendance')} value={`${d.totalSessions ?? 0}`} sub="جلسات" />
            <Stat label="الحضور" value={`${s.present ?? 0}`} sub="present" color={colors.success} />
            <Stat label="غياب" value={`${s.absent ?? 0}`} sub="absent" color={colors.error} />
            <Stat label="معذور" value={`${s.excused ?? 0}`} sub="excused" />
          </View>
          <View style={styles.filterRow}>
            <TextInput style={styles.filterInput} placeholder="من YYYY-MM-DD" placeholderTextColor={MUTED} value={from} onChangeText={setFrom} />
            <TextInput style={styles.filterInput} placeholder="إلى YYYY-MM-DD" placeholderTextColor={MUTED} value={to} onChangeText={setTo} />
          </View>
          <AppButton title={downloading ? 'جاري التحميل...' : 'تحميل Excel (مجمّع بالفصول)'} onPress={downloadExcel} variant="navy" size="md" disabled={downloading} style={{ marginTop: 12 }} />
          <Text style={styles.hint}>الأعمدة: الفصل | الاسم | النوع | الدور | حضور | غياب | النسبة | آخر حضور — ورقة لكل فصل + ملخص. ملاحظة: حضور الخدام غير متتبع حالياً.</Text>
        </View>
      );
    }
    if (report.type === 'taio') {
      return (
        <View style={styles.statsGrid}>
          <Stat label="المشاركون" value={`${d.participants ?? 0}`} />
          <Stat label="الممنوح" value={`${d.totalAwarded ?? 0}`} color={GOLD} />
          <Stat label="المستبدل" value={`${d.totalRedeemed ?? 0}`} />
          {(d.topParticipants || []).slice(0, 3).length > 0 && (
            <View style={styles.fullRow}>
              <Text style={styles.sectionLabel}>الأوائل</Text>
              {d.topParticipants.slice(0, 3).map((p: any, i: number) => (
                <Text key={i} style={styles.listItem}>#{i + 1} • {p.churchMemberId} — {p.totalPoints} نقطة</Text>
              ))}
            </View>
          )}
        </View>
      );
    }
    if (report.type === 'engagement') {
      const att = d.attendanceStats?.length ?? 0;
      const tasks = d.taskStats?.length ?? 0;
      return (
        <View style={styles.statsGrid}>
          <Stat label="تفاعل حضور" value={`${att}`} sub="أعضاء" />
          <Stat label="تفاعل مهام" value={`${tasks}`} sub="أعضاء" />
        </View>
      );
    }
    if (report.type === 'servant-performance') {
      const list = d.preparationStats || [];
      return (
        <View>
          <Text style={styles.sectionLabel}>تحضيرات الخدام ({list.length})</Text>
          {list.map((r: any, i: number) => (
            <View key={i} style={styles.rowBetween}>
              <Text style={styles.listItem}>خادم {r.servant_id}</Text>
              <AppBadge label={`${r.approved ?? 0}/${r.total ?? 0}`} variant={r.approved === r.total ? 'success' : 'warning'} />
            </View>
          ))}
          {list.length === 0 && <Text style={styles.mutedText}>{t('app.noData')}</Text>}
        </View>
      );
    }
    if (report.type === 'financial') {
      const s = d.summary || {};
      const p = d.payments || {};
      return (
        <View style={styles.statsGrid}>
          <Stat label="المتوقع" value={`${s.totalExpected ?? 0}`} />
          <Stat label="المحصل" value={`${s.totalCollected ?? 0}`} color={colors.success} />
          <Stat label="التسجيلات" value={`${s.totalRegistrations ?? 0}`} />
          <Stat label="المدفوعات" value={`${p.totalPayments ?? 0}`} />
        </View>
      );
    }
    return <Text style={styles.mutedText}>{JSON.stringify(d, null, 2)}</Text>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading} >{t('reports.title')}</Text>
      </View>
      <View style={styles.waveContainer} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[NAVY]} tintColor={NAVY} />}
      >
        <View style={styles.grid}>
          {reportTypes.map((rt) => {
            const active = activeType === rt.key;
            return (
              <TouchableOpacity
                key={rt.key}
                onPress={() => loadReport(rt.key)}
                activeOpacity={0.7}
                style={[styles.typeCard, active && styles.typeCardActive]}
              >
                <View style={[styles.iconWrap, { backgroundColor: rt.color }]}>
                  <Text style={styles.icon}>{rt.icon}</Text>
                </View>
                <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{t(`reports.${rt.key}`)}</Text>
                {active && loading && <ActivityIndicator size="small" color={NAVY} style={{ marginTop: 6 }} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {report && (
          <AppCard variant="bordered" style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>{t(`reports.${report.type}`)}</Text>
              <AppBadge label={report.type} variant="info" />
            </View>
            {loading ? <ActivityIndicator color={NAVY} style={{ marginTop: 12 }} /> : renderReportContent()}
          </AppCard>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, alignItems: 'center', justifyContent: 'center' },
  heading: { ...typography.subHeading, color: '#ffffff', textAlign: 'center' },
  waveContainer: { height: 30, backgroundColor: NAVY, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 0 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  typeCard: {
    width: '47.5%', backgroundColor: '#ffffff', borderRadius: 16, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, ...shadows.card, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  typeCardActive: { borderColor: NAVY, borderWidth: 1.5 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  icon: { fontSize: 20 },
  typeLabel: { ...typography.buttonSmall, color: NAVY, textAlign: 'center' },
  typeLabelActive: { color: NAVY, fontWeight: '700' },
  reportCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, padding: 16 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reportTitle: { ...typography.cardTitle, color: NAVY },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '47%', backgroundColor: CREAM, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { ...typography.sectionHeading, fontSize: 22, color: NAVY, fontWeight: '800' },
  statLabel: { ...typography.caption, color: MUTED, marginTop: 2, textAlign: 'center' },
  statSub: { ...typography.caption, color: MUTED, fontSize: 11 },
  sectionLabel: { ...typography.cardTitle, color: NAVY, fontSize: 13, marginBottom: 8 },
  listItem: { ...typography.body, color: NAVY, fontSize: 13, marginBottom: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  errorText: { ...typography.body, color: colors.error },
  mutedText: { ...typography.body, color: MUTED, fontStyle: 'italic', textAlign: 'center' },
  fullRow: { width: '100%', marginTop: 8 },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  filterInput: { flex: 1, backgroundColor: CREAM, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, ...typography.caption, color: NAVY },
  hint: { ...typography.caption, color: MUTED, fontSize: 11, marginTop: 8, textAlign: 'center' },
});
