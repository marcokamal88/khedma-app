import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { followUpsApi } from '../../api/follow-ups.api';
import { AppCard, AppEmptyState } from '../../components/ui';
import { colors, typography, shadows } from '../../theme';

const NAVY = colors.navy;
const CREAM = colors.cream;
const MUTED = colors.mutedGray;

const weeksLabel = (n: number | null) => {
  if (n == null) return '';
  if (n <= 0) return 'منذ أيام';
  if (n === 1) return 'منذ أسبوع';
  if (n === 2) return 'منذ أسبوعين';
  if (n <= 10) return `منذ ${n} أسابيع`;
  return `منذ ${n} أسبوعًا`;
};

/**
 * Attention list: members not attended or not followed up for 2+ weeks.
 * Opened from the warning card on the Follow-Up list page. Same population
 * and scope as the card (role-scoped by the backend).
 */
export default function AttentionListScreen({ navigation }: any) {
  const { t } = useLocale();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await followUpsApi.attention();
      setData(res?.data || res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>;
  }

  const items: any[] = data?.items || [];

  const renderItem = ({ item }: { item: any }) => {
    const reasons: string[] = item.reasons || [];
    return (
      <AppCard variant="bordered" style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>⚠</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.fullName}</Text>
            {!!item.className && <Text style={styles.cardSubtitle} numberOfLines={1}>{item.className}{item.servantName ? ` • ${item.servantName}` : ''}</Text>}
          </View>
        </View>
        {reasons.includes('attendance') && (
          <Text style={styles.alertLine}>
            {item.lastAttendanceDate
              ? `لم يحضر ${weeksLabel(item.weeksSinceAttendance)} (${String(item.lastAttendanceDate).split('T')[0]})`
              : 'لم يسجل له أي حضور'}
          </Text>
        )}
        {reasons.includes('followup') && (
          <Text style={styles.alertLine}>
            {item.lastFollowupDate
              ? `لم تتم متابعته ${weeksLabel(item.weeksSinceFollowup)} (${String(item.lastFollowupDate).split('T')[0]})`
              : 'لم تتم متابعته من قبل'}
          </Text>
        )}
        <View style={styles.cardActions}>
          {(item.phones || []).length > 0 && (
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => {
                const nums: string[] = item.phones || [];
                if (nums.length === 1) Linking.openURL(`tel:${nums[0]}`);
                else Alert.alert('اتصال', 'اختر الرقم', nums.map((n: string) => ({ text: n, onPress: () => Linking.openURL(`tel:${n}`) })).concat([{ text: 'إلغاء', style: 'cancel' } as any]));
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.callBtnText}>📞 {(item.phones || [])[0]}</Text>
            </TouchableOpacity>
          )}
          {item.familyId ? (
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() => navigation.navigate('FollowUpDetail', { id: String(item.familyId) })}
              activeOpacity={0.7}
            >
              <Text style={styles.detailBtnText}>عرض المجموعة</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </AppCard>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>يحتاجون متابعة</Text>
      </View>
      <View style={styles.waveContainer} />
      <FlatList
        data={items}
        keyExtractor={(item: any) => String(item.memberId)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <Text style={styles.headerNote}>مخدومون لم يحضروا أو لم تتم متابعتهم منذ أسبوعين أو أكثر — تواصل معهم وسجّل المتابعة.</Text>
        }
        ListEmptyComponent={<AppEmptyState icon="users" title={t('app.noData')} />}
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
  list: { padding: 16, gap: 12, paddingBottom: 80 },
  headerNote: { ...typography.caption, color: MUTED, textAlign: 'right', marginBottom: 4 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, padding: 14 },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#c62828', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18, color: '#ffffff' },
  cardTitle: { ...typography.cardTitle, color: NAVY, flex: 1, textAlign: 'right' },
  cardSubtitle: { ...typography.caption, color: MUTED, textAlign: 'right' },
  alertLine: { ...typography.body, color: '#c62828', textAlign: 'right', marginTop: 4, fontWeight: '600' },
  cardActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 10 },
  callBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 18, backgroundColor: '#e8f5e9' },
  callBtnText: { fontSize: 13, color: NAVY, fontWeight: '700' },
  detailBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: NAVY },
  detailBtnText: { ...typography.caption, color: '#ffffff', fontWeight: '700' },
});
