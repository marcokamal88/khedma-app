import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { useActiveContext } from '../../hooks/useActiveContext';
import { followUpsApi } from '../../api/follow-ups.api';
import { servantAssignmentsApi } from '../../api/servant-assignments.api';
import { AppCard, AppBadge, AppEmptyState } from '../../components/ui';
import { colors, typography, shadows } from '../../theme';

const NAVY = colors.navy;
const CREAM = colors.cream;
const MUTED = colors.mutedGray;

type TypeFilter = 'all' | 'served_member' | 'servant';

export default function MonitoringScreen({ navigation }: any) {
  const { t } = useLocale();
  const { serviceId, isServiceLeader, isSectorLeader } = useActiveContext() as any;
  const [filter, setFilter] = useState<TypeFilter>('all');
  const [items, setItems] = useState<any[]>([]);
  const [names, setNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (isServiceLeader || isSectorLeader) { if (serviceId) params.serviceId = String(serviceId); }
      if (filter !== 'all') params.targetType = filter;
      const [famRes, servRes] = await Promise.all([
        followUpsApi.getAll(params).catch(() => ({ data: [] })),
        (isServiceLeader || isSectorLeader) && serviceId
          ? servantAssignmentsApi.getAll(String(serviceId)).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ]);
      const fams: any[] = (famRes as any)?.data || famRes || [];
      const list = Array.isArray(fams) ? fams : [];
      const allServ: any[] = (servRes as any)?.data || (servRes as any) || [];
      const nm: Record<number, string> = {};
      for (const a of (Array.isArray(allServ) ? allServ : [])) {
        if (a && a.churchMemberId && a.fullName) nm[Number(a.churchMemberId)] = a.fullName;
      }
      setNames(nm);
      const withMon = await Promise.all(
        list.map(async (f: any) => {
          try {
            const m: any = await followUpsApi.monitoring(String(f.id));
            return { family: f, mon: m?.data || m };
          } catch {
            return { family: f, mon: null };
          }
        }),
      );
      setItems(withMon);
    } catch {
      setItems([]);
    } finally { setLoading(false); }
  }, [filter, serviceId, isServiceLeader, isSectorLeader]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

  const respName = (f: any) => {
    const rid = Number(f.responsibleMemberId || f.servantId);
    return names[rid] || f.responsible?.user?.fullName || f.servant?.user?.fullName || `خادم ${rid}`;
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>متابعة الافتقاد</Text>
      </View>
      <View style={styles.waveContainer} />

      <View style={styles.tabs}>
        {(['all', 'served_member', 'servant'] as TypeFilter[]).map((k) => (
          <TouchableOpacity key={k} style={[styles.tab, filter === k && styles.tabActive]} onPress={() => setFilter(k)} activeOpacity={0.7}>
            <Text style={[styles.tabText, filter === k && styles.tabTextActive]}>
              {k === 'all' ? 'الكل' : k === 'served_member' ? t('followUp.servedMember') : t('followUp.servant')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.family.id)}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<AppEmptyState icon="users" title={t('app.noData')} />}
        renderItem={({ item }: any) => {
          const f = item.family;
          const m = item.mon;
          const rate = m?.rate ?? 0;
          const open = expanded === Number(f.id);
          return (
            <AppCard variant="bordered" style={styles.card}>
              <TouchableOpacity onPress={() => setExpanded(open ? null : Number(f.id))} activeOpacity={0.7}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{f.name || `مجموعة ${respName(f)}`}</Text>
                    <Text style={styles.cardSubtitle}>المسؤول: {respName(f)}{f.class?.name ? ` • ${f.class.name}` : ''}</Text>
                  </View>
                  <AppBadge label={f.status === 'active' ? t('followUp.active') : f.status === 'paused' ? t('followUp.paused') : t('followUp.completed')} variant={f.status === 'active' ? 'success' : f.status === 'paused' ? 'warning' : 'info'} />
                </View>
                <View style={styles.progressRow}>
                  <View style={styles.barBg}><View style={[styles.barFill, { width: `${rate}%` }]} /></View>
                  <Text style={styles.rateText}>{m ? `${m.contacted}/${m.total} (${rate}%)` : '—'}</Text>
                </View>
              </TouchableOpacity>
              {open && (
                <View style={styles.members}>
                  {(m?.members || []).map((mem: any) => (
                    <View key={mem.targetMemberId} style={styles.memberRow}>
                      <Text style={styles.memberName}>{mem.target?.user?.fullName || `#${mem.targetMemberId}`}</Text>
                      <Text style={styles.memberMeta}>
                        {mem.lastLog ? `آخر تواصل: ${(mem.lastLog.loggedAt || '').toString().split('T')[0]} (${mem.lastLog.logType})` : 'لم يتم التواصل'}
                      </Text>
                    </View>
                  ))}
                  {(m?.members || []).length === 0 && <Text style={styles.muted}>لا يوجد أعضاء</Text>}
                  <TouchableOpacity onPress={() => navigation.navigate('FollowUpDetail', { id: f.id })} activeOpacity={0.7}>
                    <Text style={styles.detailLink}>عرض التفاصيل ›</Text>
                  </TouchableOpacity>
                </View>
              )}
            </AppCard>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CREAM },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, alignItems: 'center', justifyContent: 'center' },
  heading: { ...typography.subHeading, color: '#ffffff', textAlign: 'center' },
  waveContainer: { height: 30, backgroundColor: NAVY, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 0 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  tabActive: { backgroundColor: NAVY, borderColor: NAVY },
  tabText: { ...typography.buttonSmall, color: MUTED },
  tabTextActive: { color: '#ffffff' },
  list: { padding: 16, gap: 12, paddingBottom: 24 },
  card: { padding: 14 },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  cardTitle: { ...typography.cardTitle, color: NAVY, textAlign: 'right' },
  cardSubtitle: { ...typography.caption, color: MUTED, textAlign: 'right', marginTop: 2 },
  progressRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 10 },
  barBg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#eef2f7', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.success },
  rateText: { ...typography.caption, color: NAVY, fontWeight: '700' },
  members: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  memberRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  memberName: { ...typography.body, color: NAVY, textAlign: 'right', fontSize: 14 },
  memberMeta: { ...typography.caption, color: MUTED, textAlign: 'right', marginTop: 2 },
  muted: { ...typography.caption, color: MUTED, fontStyle: 'italic', textAlign: 'center' },
  detailLink: { ...typography.buttonSmall, color: NAVY, textAlign: 'center', marginTop: 8, fontWeight: '700' },
});
