import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Linking, Alert } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { useActiveContext } from '../../hooks/useActiveContext';
import { followUpsApi } from '../../api/follow-ups.api';
import { AppCard, AppBadge, AppEmptyState } from '../../components/ui';
import { colors, typography, shadows } from '../../theme';

const NAVY = colors.navy;
const GOLD = colors.gold;
const CREAM = colors.cream;
const MUTED = colors.mutedGray;

export default function FollowUpListScreen({ navigation }: any) {
  const { t } = useLocale();
  const { serviceId, isServiceLeader, isSectorLeader } = useActiveContext() as any;
  const [mode, setMode] = useState<'weekly' | 'all'>('weekly');
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [weekly, setWeekly] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === 'weekly') {
        const w: any = await followUpsApi.weekly();
        setWeekly(w?.data || w);
        // also load my families for list preview
        const res: any = await followUpsApi.getAll(isServiceLeader || isSectorLeader ? { serviceId } as any : {});
        setFollowUps(Array.isArray(res) ? res : res?.data || []);
      } else {
        const res: any = await followUpsApi.getAll(isServiceLeader || isSectorLeader ? { serviceId } as any : {});
        setFollowUps(Array.isArray(res) ? res : res?.data || []);
        setWeekly(null);
      }
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    } finally {
      setLoading(false);
    }
  }, [mode, serviceId, isServiceLeader, isSectorLeader]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>;
  }

  const renderItem = ({ item }: any) => {
    const targetCount = item.assignments?.length ?? 0;
    const svcName = item.service?.name || item.class?.name || '';
    const isServantTarget = item.targetType === 'servant';
    return (
      <TouchableOpacity onPress={() => navigation.navigate('FollowUpDetail', { id: item.id })} activeOpacity={0.7}>
        <AppCard variant="bordered" style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{isServantTarget ? '👔' : '👥'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name || (isServantTarget ? t('followUp.servant') : item.class?.name || svcName || t('followUp.title'))}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>{svcName} {item.class?.name ? `• ${item.class.name}` : ''}</Text>
            </View>
            <AppBadge label={item.status === 'active' ? t('followUp.active') : item.status === 'paused' ? t('followUp.paused') : t('followUp.completed')} variant={item.status === 'active' ? 'success' : item.status === 'paused' ? 'warning' : 'info'} />
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardMeta}>{targetCount} {isServantTarget ? t('followUp.servant') : t('followUp.servedMember')}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </AppCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>{t('followUp.title')}</Text>
      </View>
      <View style={styles.waveContainer} />

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, mode === 'weekly' && styles.tabActive]} onPress={() => setMode('weekly')} activeOpacity={0.7}>
          <Text style={[styles.tabText, mode === 'weekly' && styles.tabTextActive]}>هذا الأسبوع</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, mode === 'all' && styles.tabActive]} onPress={() => setMode('all')} activeOpacity={0.7}>
          <Text style={[styles.tabText, mode === 'all' && styles.tabTextActive]}>الكل</Text>
        </TouchableOpacity>
        {(isServiceLeader || isSectorLeader) && (
          <>
            <TouchableOpacity style={styles.manageBtn} onPress={() => navigation.navigate('Monitoring')} activeOpacity={0.7}>
              <Text style={styles.manageText}>المتابعة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.manageBtn} onPress={() => navigation.navigate('ManageGroups')} activeOpacity={0.7}>
              <Text style={styles.manageText}>إدارة المجموعات</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {mode === 'weekly' && weekly && (
        <View style={styles.weeklyCard}>
          <Text style={styles.weeklyTitle}>متابعتي هذا الأسبوع</Text>
          <Text style={[styles.weeklyRange, { writingDirection: 'ltr' }]}>{weekly.weekStart} → {weekly.weekEnd}</Text>
          <View style={styles.weeklyRow}>
            <View style={[styles.pill, { backgroundColor: '#e8f5e9' }]}><Text style={styles.pillText}>تم: {(weekly.members || []).filter((m: any) => m.doneThisWeek).length}</Text></View>
            <View style={[styles.pill, { backgroundColor: '#fce4ec' }]}><Text style={styles.pillText}>متبقي: {(weekly.members || []).filter((m: any) => !m.doneThisWeek).length}</Text></View>
            <View style={[styles.pill, { backgroundColor: '#e3f2fd' }]}><Text style={styles.pillText}>الكل: {(weekly.members || []).length}</Text></View>
          </View>
          {(weekly.members || []).map((m: any) => {
            const last = m.lastLog;
            return (
              <View key={m.memberId} style={styles.memberRow}>
                <View style={styles.memberTopRow}>
                  <Text style={styles.memberName} numberOfLines={1} ellipsizeMode="tail">{m.fullName}</Text>
                  {m.doneThisWeek ? (
                    <View style={[styles.pill, { backgroundColor: '#e8f5e9' }]}><Text style={styles.pillText}>تم ✓</Text></View>
                  ) : null}
                </View>
                <Text style={styles.memberMeta} numberOfLines={1} ellipsizeMode="tail">
                  {m.doneThisWeek
                    ? `آخر تواصل: ${last?.logType || ''} ${String(last?.loggedAt || '').split('T')[0]}`
                    : last ? `آخر تواصل سابق: ${String(last?.loggedAt || '').split('T')[0]}` : 'لم يتم التواصل بعد'}
                </Text>
                <View style={styles.memberActions}>
                  {(m.phones || []).length > 0 && (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => {
                        const nums: string[] = m.phones || [];
                        if (nums.length === 1) Linking.openURL(`tel:${nums[0]}`);
                        else Alert.alert('اتصال', 'اختر الرقم', nums.map((n: string) => ({ text: n, onPress: () => Linking.openURL(`tel:${n}`) })).concat([{ text: 'إلغاء', style: 'cancel' } as any]));
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.callBtnText}>📞 {(m.phones || [])[0]}</Text>
                    </TouchableOpacity>
                  )}
                  {!m.doneThisWeek && m.familyId ? (
                    <TouchableOpacity
                      style={styles.logBtn}
                      onPress={() => navigation.navigate('AddActivity', { followUpId: String(m.familyId), targetMemberId: Number(m.memberId) })}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.logBtnText}>+ تسجيل</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <FlatList
        data={followUps}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<AppEmptyState icon="users" title={t('app.noData')} />}
      />
      {(() => {
        const isServantUser = !isServiceLeader && !isSectorLeader;
        const hideFab = isServantUser && mode === 'weekly' && followUps.length > 0;
        if (hideFab) return null;
        return (
          <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateFollowUp')} activeOpacity={0.8}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CREAM },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, alignItems: 'center', justifyContent: 'center' },
  heading: { ...typography.subHeading, color: '#ffffff', textAlign: 'center' },
  waveContainer: { height: 30, backgroundColor: NAVY, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 0 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, alignItems: 'center' },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  tabActive: { backgroundColor: NAVY, borderColor: NAVY },
  tabText: { ...typography.buttonSmall, color: MUTED },
  tabTextActive: { color: '#ffffff' },
  manageBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: GOLD, alignItems: 'center' },
  manageText: { ...typography.buttonSmall, color: '#ffffff', fontWeight: '700' },
  weeklyCard: { marginHorizontal: 16, marginTop: 12, backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, ...shadows.card, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  weeklyTitle: { ...typography.cardTitle, color: NAVY, marginBottom: 8, textAlign: 'right' },
  weeklyRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  pillText: { ...typography.caption, color: NAVY, fontWeight: '600' },
  mutedSmall: { ...typography.caption, color: MUTED, marginTop: 6, textAlign: 'right' },
  weeklyRange: { ...typography.caption, color: MUTED, textAlign: 'center', marginBottom: 8 },
  memberRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  memberTopRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  memberName: { ...typography.body, color: NAVY, fontWeight: '700', textAlign: 'right', flex: 1, flexShrink: 1, minWidth: 0, lineHeight: 24 },
  memberMeta: { ...typography.caption, color: MUTED, textAlign: 'right', marginTop: 4, lineHeight: 18 },
  memberActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 8 },
  callBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 18, backgroundColor: '#e8f5e9' },
  callBtnText: { fontSize: 13, color: NAVY, fontWeight: '700' },
  logBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: NAVY },
  logBtnText: { ...typography.caption, color: '#ffffff', fontWeight: '700' },
  list: { padding: 16, gap: 12, paddingBottom: 80 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, padding: 14 },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 16, color: '#ffffff' },
  cardTitle: { ...typography.cardTitle, color: NAVY, flex: 1, textAlign: 'right' },
  cardSubtitle: { ...typography.caption, color: MUTED, textAlign: 'right' },
  cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 8 },
  cardMeta: { ...typography.caption, color: MUTED },
  chevron: { fontSize: 20, color: MUTED },
  fab: { position: 'absolute', bottom: 24, left: 20, width: 56, height: 56, backgroundColor: GOLD, borderRadius: 28, justifyContent: 'center', alignItems: 'center', ...shadows.card, elevation: 4 },
  fabText: { fontSize: 28, color: '#ffffff', lineHeight: 30, fontWeight: '700' },
});
