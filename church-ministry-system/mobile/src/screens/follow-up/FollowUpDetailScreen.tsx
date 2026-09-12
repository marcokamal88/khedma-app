import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Linking, Alert } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { useAuth } from '../../hooks/useAuth';
import { followUpsApi } from '../../api/follow-ups.api';
import { AppCard, AppButton, AppBadge, AppInput } from '../../components/ui';
import { colors, typography, spacing, shadows } from '../../theme';

const NAVY = colors.navy;
const CREAM = colors.cream;
const MUTED = colors.mutedGray;

export default function FollowUpDetailScreen({ route, navigation }: any) {
  const { t } = useLocale();
  const { memberId } = useAuth();
  const { id } = route.params;
  const [followUp, setFollowUp] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [famRes, logsRes] = await Promise.all([
        followUpsApi.getOne(String(id)),
        followUpsApi.getActivities(String(id)).catch(() => ({ data: [] })),
      ]);
      const fam = (famRes as any)?.data || famRes;
      setFollowUp(fam);
      const l = (logsRes as any)?.data || logsRes;
      setLogs(Array.isArray(l) ? l : []);
    } catch (err) {
      console.error('Failed to load follow-up:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

  const handleStatusChange = async (status: string) => {
    try {
      await followUpsApi.updateStatus(String(id), status);
      setFollowUp((prev: any) => ({ ...prev, status }));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>;
  }

  if (!followUp) {
    return <View style={styles.center}><AppCard variant="bordered"><Text>{t('app.noData')}</Text></AppCard></View>;
  }

  const responsibleName = followUp.responsible?.user?.fullName || followUp.servant?.user?.fullName || followUp.responsible?.fullName || followUp.servant?.fullName || '—';
  const serviceName = followUp.service?.name || '';
  const className = followUp.class?.name || '';
  const targetTypeLabel = followUp.targetType === 'servant' ? t('followUp.servant') : t('followUp.servedMember');
  const assignments = followUp.assignments || [];
  const isResponsible = Number(memberId) === Number(followUp.responsibleMemberId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading} >{followUp.name || targetTypeLabel}</Text>
      </View>
      <View style={styles.waveContainer} />
      <FlatList
        data={logs}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <View>
            <AppCard variant="bordered" style={styles.headerCard}>
              <Text style={styles.title}>{followUp.name || `${targetTypeLabel} — ${serviceName}`}</Text>
              <Text style={styles.meta}>المسؤول: {responsibleName}</Text>
              {serviceName ? <Text style={styles.meta}>الخدمة: {serviceName}</Text> : null}
              {className ? <Text style={styles.meta}>الفصل: {className}</Text> : null}
              <Text style={styles.meta}>النوع: {targetTypeLabel}</Text>
              <View style={styles.statusRow}>
                {['active', 'paused', 'completed'].map((s) => (
                  <TouchableOpacity key={s} style={[styles.statusBtn, followUp.status === s && styles.statusBtnActive]} onPress={() => handleStatusChange(s)} activeOpacity={0.7}>
                    <Text style={[styles.statusBtnText, followUp.status === s && styles.statusBtnTextActive]}>{t(`followUp.${s}`)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {assignments.length > 0 && (
                <View style={styles.assignBlock}>
                  <Text style={styles.sectionSmall}>المكلفون ({assignments.length})</Text>
                  {assignments.map((a: any) => {
                    const targetName = a.target?.user?.fullName || a.churchMember?.user?.fullName || a.target?.fullName || `#${a.targetMemberId || a.churchMemberId}`;
                    const phones: string[] = a.target?.phones || [];
                    const phone = phones[0] || a.target?.user?.phone || '';
                    const tid = Number(a.targetMemberId || a.churchMemberId);
                    return (
                      <View key={a.id || tid} style={styles.memberRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.memberName}>{targetName} {a.isActive ? '' : '(غير نشط)'}</Text>
                          {phone ? <Text style={styles.memberPhone}>{phone}</Text> : null}
                        </View>
                        {phone ? (
                          <TouchableOpacity
                            style={styles.callBtn}
                            onPress={() => {
                              if (phones.length > 1) {
                                Alert.alert('اتصال', 'اختر الرقم', phones.map((n: string) => ({ text: n, onPress: () => Linking.openURL(`tel:${n}`) })).concat([{ text: 'إلغاء', style: 'cancel' } as any]));
                              } else Linking.openURL(`tel:${phone}`);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.callBtnText}>📞</Text>
                          </TouchableOpacity>
                        ) : null}
                        {isResponsible ? (
                          <TouchableOpacity
                            style={styles.logBtn}
                            onPress={() => navigation.navigate('AddActivity', { followUpId: String(id), targetMemberId: tid })}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.logBtnText}>+ تسجيل</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
              {isResponsible && (
                <View style={styles.groupEditBlock}>
                  {!editingGroup ? (
                    <TouchableOpacity onPress={() => { setEditName(followUp.name || ''); setEditNotes(followUp.notes || ''); setEditingGroup(true); }} activeOpacity={0.7}>
                      <Text style={styles.editGroupLink}>تعديل المجموعة</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <AppInput value={editName} onChangeText={setEditName} placeholder="اسم المجموعة" textAlign="right" />
                      <AppInput value={editNotes} onChangeText={setEditNotes} placeholder="ملاحظات" multiline numberOfLines={2} textAlign="right" />
                      <AppButton
                        title="حفظ"
                        loading={savingGroup}
                        variant="navy"
                        onPress={async () => {
                          setSavingGroup(true);
                          try {
                            await followUpsApi.update(String(id), { name: editName.trim() || undefined, notes: editNotes });
                            setEditingGroup(false);
                            loadData();
                          } catch (err: any) {
                            Alert.alert('', err?.message || t('app.error'));
                          } finally { setSavingGroup(false); }
                        }}
                      />
                    </>
                  )}
                </View>
              )}
            </AppCard>
            {isResponsible && (
              <AppButton title={`+ ${t('followUp.addActivity')}`} onPress={() => navigation.navigate('AddActivity', { followUpId: id })} variant="navy" style={styles.addBtn} />
            )}
            {!isResponsible && (
              <Text style={styles.readOnlyHint}>العرض فقط — النشاطات يضيفها الخادم المسؤول</Text>
            )}
            {logs.length === 0 && <Text style={styles.empty}>لا توجد سجلات بعد</Text>}
          </View>
        }
        renderItem={({ item }: any) => (
          <AppCard variant="bordered" style={styles.logCard}>
            <View style={styles.logHeader}>
              <AppBadge label={item.logType || item.activityType} variant="info" />
              <Text style={styles.logDate}>{(item.loggedAt || item.activityDate || '').toString().split('T')[0]}</Text>
            </View>
            {(item.target?.user?.fullName || item.churchMember?.user?.fullName) ? <Text style={styles.logTarget}>المخدوم: {item.target?.user?.fullName || item.churchMember?.user?.fullName}</Text> : null}
            <Text style={styles.logNotes}>{item.notes || item.summary}</Text>
            {item.nextAction ? <Text style={styles.nextAction}>التالي: {item.nextAction} {item.nextActionDate ? `— ${item.nextActionDate}` : ''}</Text> : null}
            <Text style={styles.logMeta}>بواسطة: {item.creator?.user?.fullName || item.creator?.fullName || item.author?.fullName || `#${item.createdBy || ''}`}</Text>
          </AppCard>
        )}
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
  headerCard: { marginHorizontal: 16, marginTop: 16, padding: 16 },
  title: { ...typography.cardTitle, color: NAVY, marginBottom: 6, textAlign: 'right' },
  meta: { ...typography.caption, color: MUTED, textAlign: 'right', marginBottom: 2 },
  statusRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 10 },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#eef2f7', borderWidth: 1, borderColor: colors.border },
  statusBtnActive: { backgroundColor: NAVY, borderColor: NAVY },
  statusBtnText: { ...typography.caption, color: MUTED },
  statusBtnTextActive: { color: '#ffffff' },
  assignBlock: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  sectionSmall: { ...typography.caption, color: NAVY, fontWeight: '700', marginBottom: 6, textAlign: 'right' },
  assignItem: { ...typography.caption, color: MUTED, textAlign: 'right', marginBottom: 2 },
  memberRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  memberName: { ...typography.body, color: NAVY, fontWeight: '700', textAlign: 'right', flex: 1 },
  memberPhone: { ...typography.caption, color: MUTED, textAlign: 'right', marginTop: 2 },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' },
  callBtnText: { fontSize: 16 },
  logBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: NAVY },
  logBtnText: { ...typography.caption, color: '#ffffff', fontWeight: '700' },
  groupEditBlock: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  editGroupLink: { ...typography.caption, color: NAVY, fontWeight: '700', textAlign: 'center' },
  list: { padding: 16, gap: 12, paddingBottom: 24 },
  addBtn: { marginHorizontal: 16, marginTop: 12, marginBottom: 8 },
  readOnlyHint: { ...typography.caption, color: MUTED, textAlign: 'center', marginTop: 12, marginBottom: 8, fontStyle: 'italic' },
  empty: { ...typography.caption, color: MUTED, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  logCard: { padding: 14 },
  logHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logDate: { ...typography.caption, color: MUTED },
  logTarget: { ...typography.caption, color: NAVY, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  logNotes: { ...typography.body, color: colors.textPrimary, textAlign: 'right', marginBottom: 6 },
  nextAction: { ...typography.caption, color: colors.info, fontStyle: 'italic', textAlign: 'right', marginBottom: 4 },
  logMeta: { ...typography.caption, color: MUTED, textAlign: 'right', fontSize: 11 },
});
