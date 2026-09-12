import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { useActiveContext } from '../../hooks/useActiveContext';
import { followUpsApi } from '../../api/follow-ups.api';
import { churchApi } from '../../api/church.api';
import { servantAssignmentsApi } from '../../api/servant-assignments.api';
import { AppCard, AppButton, AppEmptyState } from '../../components/ui';
import { colors, typography, shadows } from '../../theme';

const NAVY = colors.navy;
const CREAM = colors.cream;
const MUTED = colors.mutedGray;
const GOLD = colors.gold;

export default function ManageGroupsScreen({ navigation }: any) {
  const { t } = useLocale();
  const { serviceId, isServant, isClassLeader } = useActiveContext() as any;
  const canCreateHere = !!(isServant || isClassLeader);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [servantNames, setServantNames] = useState<Record<number, string>>({});
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadClasses = useCallback(async () => {
    if (!serviceId) return;
    try { const res: any = await churchApi.getClasses(String(serviceId)); setClasses(res?.data || []); if (!selectedClassId && res?.data?.[0]) setSelectedClassId(String(res.data[0].id)); } catch {}
  }, [serviceId]);

  const loadData = useCallback(async () => {
    if (!selectedClassId || !serviceId) return;
    setLoading(true);
    try {
      const [stuRes, famRes, servRes] = await Promise.all([
        churchApi.getClassStudents(String(selectedClassId)).catch(() => ({ data: [] })),
        followUpsApi.getAll({ classId: String(selectedClassId), serviceId: String(serviceId) } as any).catch(() => ({ data: [] })),
        servantAssignmentsApi.getAll(String(serviceId)).catch(() => ({ data: [] })),
      ]);
      setStudents((stuRes as any)?.data || []);
      const famData: any = (famRes as any)?.data || famRes;
      setFamilies(Array.isArray(famData) ? famData : []);
      const allServ: any[] = (servRes as any)?.data || (servRes as any) || [];
      const names: Record<number, string> = {};
      for (const a of (Array.isArray(allServ) ? allServ : [])) {
        if (a && a.churchMemberId && a.fullName) names[Number(a.churchMemberId)] = a.fullName;
      }
      setServantNames(names);
    } catch { setStudents([]); setFamilies([]); setServantNames({}); } finally { setLoading(false); }
  }, [selectedClassId, serviceId]);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setSelectedFamilyId(null); setSelectedStudentIds([]); }, [selectedClassId]);
  useEffect(() => {
    if (!selectedFamilyId && families.length > 0) setSelectedFamilyId(Number(families[0].id));
  }, [families, selectedFamilyId]);

  const toggleStudent = (id: number) => setSelectedStudentIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const groupedIds = new Set<number>();
  families.forEach((f: any) => (f.assignments || []).forEach((a: any) => {
    if (a.isActive !== false && a.targetMemberId) groupedIds.add(Number(a.targetMemberId));
  }));
  const studentMap = new Map<number, string>(students.map((s: any) => [Number(s.id), s.fullName]));
  const ungrouped = students.filter((s: any) => !groupedIds.has(Number(s.id)));

  const handleRemoveMember = (familyId: number, targetId: number, name: string) => {
    Alert.alert('إزالة من المجموعة', `إزالة ${name} من المجموعة؟`, [
      { text: t('app.cancel'), style: 'cancel' },
      {
        text: t('app.delete'), style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await followUpsApi.removeMember(String(familyId), String(targetId));
            loadData();
          } catch (err: any) { Alert.alert('', err?.response?.data?.message || err?.message || t('app.error')); } finally { setSaving(false); }
        },
      },
    ]);
  };

  const responsibleName = (f: any) => {
    const rid = Number(f.responsibleMemberId || f.servantId);
    return servantNames[rid] || f.responsible?.user?.fullName || f.servant?.user?.fullName || `خادم ${rid}`;
  };

  const handleAddToGroup = async () => {
    if (!selectedFamilyId || selectedStudentIds.length === 0) { Alert.alert('', 'اختر المجموعة والطلاب'); return; }
    setSaving(true);
    try {
      await followUpsApi.addMembers(String(selectedFamilyId), selectedStudentIds);
      Alert.alert('', 'تمت الإضافة إلى المجموعة');
      setSelectedStudentIds([]);
      loadData();
    } catch (err: any) { Alert.alert('', err?.response?.data?.message || err?.message || t('app.error')); } finally { setSaving(false); }
  };

  const handleCreateGroup = async () => {
    if (selectedStudentIds.length === 0) { Alert.alert('', 'اختر الطلاب أولاً'); return; }
    setSaving(true);
    try {
      await followUpsApi.create({ classId: Number(selectedClassId), targetType: 'served_member', memberIds: selectedStudentIds, name: newGroupName.trim() || undefined } as any);
      Alert.alert('', 'تم إنشاء المجموعة');
      setSelectedStudentIds([]);
      setNewGroupName('');
      loadData();
    } catch (err: any) { Alert.alert('', err?.response?.data?.message || err?.message || t('app.error')); } finally { setSaving(false); }
  };

  if (loading && classes.length === 0) return <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>إدارة مجموعات الافتقاد</Text>
      </View>
      <View style={styles.waveContainer} />
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {classes.map((c: any) => (
            <TouchableOpacity key={c.id} style={[styles.chip, selectedClassId === String(c.id) && styles.chipActive]} onPress={() => setSelectedClassId(String(c.id))} activeOpacity={0.7}>
              <Text style={[styles.chipText, selectedClassId === String(c.id) && styles.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>مجموعات الفصل ({families.length}) — اختر مجموعة</Text>
        {families.map((f: any) => {
          const active = selectedFamilyId === Number(f.id);
          const members = (f.assignments || []).filter((a: any) => a.isActive !== false);
          return (
            <TouchableOpacity key={f.id} onPress={() => setSelectedFamilyId(Number(f.id))} activeOpacity={0.7}>
              <AppCard variant="bordered" style={[styles.groupCard, active && styles.groupCardActive]}>
                <View style={styles.groupRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.groupName} numberOfLines={1} ellipsizeMode="tail">{f.name || `مجموعة ${responsibleName(f)}`}</Text>
                    <Text style={styles.groupMeta}>المسؤول: {responsibleName(f)} • الأعضاء: {members.length}</Text>
                  </View>
                  <View style={[styles.check, active && styles.checkActive]}><Text style={styles.checkText}>{active ? '✓' : ''}</Text></View>
                </View>
                {active && (
                  <View style={styles.groupMembers}>
                    {members.map((a: any) => {
                      const tid = Number(a.targetMemberId);
                      const nm = studentMap.get(tid) || `مخدوم ${tid}`;
                      return (
                        <View key={a.id || tid} style={styles.groupMemberRow}>
                          <Text style={styles.groupMemberName} numberOfLines={1} ellipsizeMode="tail">{nm}</Text>
                          <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={() => handleRemoveMember(Number(f.id), tid, nm)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={styles.removeBtnText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                    {members.length === 0 && <Text style={styles.muted}>لا يوجد أعضاء بعد — اختر من القائمة بالأسفل</Text>}
                  </View>
                )}
              </AppCard>
            </TouchableOpacity>
          );
        })}
        {families.length === 0 && <Text style={styles.muted}>لا توجد مجموعات في هذا الفصل بعد</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>مخدومون خارج المجموعات ({ungrouped.length}) — اختر للإضافة للمجموعة</Text>
        <FlatList
          data={ungrouped}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }: any) => {
            const active = selectedStudentIds.includes(Number(item.id));
            return (
              <TouchableOpacity style={[styles.memberRow, active && styles.memberRowActive]} onPress={() => toggleStudent(Number(item.id))} activeOpacity={0.7}>
                <Text style={styles.memberName} numberOfLines={1} ellipsizeMode="tail">{item.fullName}</Text>
                <View style={[styles.check, active && styles.checkActive]}><Text style={styles.checkText}>{active ? '✓' : ''}</Text></View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<AppEmptyState icon="users" title="كل المخدومين في مجموعات" />}
        />
      </View>

      <View style={styles.footer}>
        <AppButton title={`إضافة ${selectedStudentIds.length} للمجموعة`} onPress={handleAddToGroup} loading={saving} variant="navy" disabled={!selectedFamilyId || selectedStudentIds.length === 0} />
        {canCreateHere ? (
          <>
            <TextInput style={styles.input} value={newGroupName} onChangeText={setNewGroupName} placeholder="اسم مجموعة جديدة (اختياري)" placeholderTextColor={MUTED} />
            <AppButton title="إنشاء مجموعة جديدة بالمحدد" onPress={handleCreateGroup} loading={saving} variant="secondary" disabled={selectedStudentIds.length === 0} style={{ marginTop: 8 }} />
          </>
        ) : (
          <Text style={styles.hint}>لإنشاء مجموعة لخادم معين استخدم شاشة «متابعة جديدة» — هنا تُضاف الأعضاء للمجموعات القائمة فقط</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CREAM },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, alignItems: 'center', justifyContent: 'center' },
  heading: { ...typography.subHeading, color: '#ffffff', textAlign: 'center' },
  waveContainer: { height: 30, backgroundColor: NAVY, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 0 },
  filterRow: { paddingHorizontal: 16, paddingTop: 12 },
  chips: { gap: 8, paddingRight: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: NAVY, borderColor: NAVY },
  chipText: { ...typography.caption, color: MUTED },
  chipTextActive: { color: '#ffffff' },
  section: { paddingHorizontal: 16, paddingTop: 12 },
  sectionTitle: { ...typography.cardTitle, color: NAVY, fontSize: 13, marginBottom: 8, textAlign: 'right' },
  groupCard: { marginBottom: 8, padding: 12 },
  groupCardActive: { borderColor: GOLD, borderWidth: 1.5 },
  groupRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  groupName: { ...typography.body, color: NAVY, fontWeight: '700', textAlign: 'right', lineHeight: 24 },
  groupMeta: { ...typography.caption, color: MUTED, textAlign: 'right', marginTop: 2, lineHeight: 18 },
  groupMembers: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  groupMemberRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 6 },
  groupMemberName: { ...typography.body, color: NAVY, flex: 1, flexShrink: 1, minWidth: 0, textAlign: 'right', lineHeight: 22 },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fce4ec', alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { fontSize: 14, color: colors.error, fontWeight: '700', lineHeight: 16 },
  muted: { ...typography.caption, color: MUTED, fontStyle: 'italic', textAlign: 'right' },
  memberRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 6 },
  memberRowActive: { borderColor: NAVY, backgroundColor: '#eef2f7' },
  memberName: { ...typography.body, color: NAVY, flex: 1, flexShrink: 1, minWidth: 0, textAlign: 'right', lineHeight: 22 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  checkActive: { backgroundColor: NAVY, borderColor: NAVY },
  checkText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  list: { paddingBottom: 12 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: '#ffffff' },
  input: { backgroundColor: CREAM, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, ...typography.body, color: NAVY, marginTop: 8 },
  hint: { ...typography.caption, color: MUTED, fontSize: 11, marginTop: 8, textAlign: 'center' },
});
