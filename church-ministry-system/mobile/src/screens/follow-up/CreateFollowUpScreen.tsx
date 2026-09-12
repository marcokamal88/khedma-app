import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { useActiveContext } from '../../hooks/useActiveContext';
import { followUpsApi } from '../../api/follow-ups.api';
import { churchApi } from '../../api/church.api';
import { servantAssignmentsApi } from '../../api/servant-assignments.api';
import { AppInput, AppButton, AppCard } from '../../components/ui';
import { colors, typography, shadows } from '../../theme';

const NAVY = colors.navy;
const CREAM = colors.cream;
const MUTED = colors.mutedGray;

export default function CreateFollowUpScreen({ navigation }: any) {
  const { t } = useLocale();
  const { serviceId, classId, isServiceLeader, isAsstServiceLeader } = useActiveContext() as any;
  const canPickResponsible = !!(isServiceLeader || isAsstServiceLeader);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(classId ? String(classId) : '');
  const [students, setStudents] = useState<any[]>([]);
  const [servants, setServants] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedServantTargets, setSelectedServantTargets] = useState<number[]>([]);
  const [responsibleId, setResponsibleId] = useState<number | null>(null);
  const [targetType, setTargetType] = useState<'served_member' | 'servant'>('served_member');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadClasses = useCallback(async () => {
    if (!serviceId) return;
    try { const res: any = await churchApi.getClasses(String(serviceId)); setClasses(res?.data || []); if (!selectedClassId && res?.data?.[0]) setSelectedClassId(String(res.data[0].id)); } catch {}
  }, [serviceId, selectedClassId]);

  const loadStudents = useCallback(async () => {
    if (!selectedClassId) { setStudents([]); return; }
    try { const res: any = await churchApi.getClassStudents(String(selectedClassId)); setStudents(res?.data || []); } catch { setStudents([]); }
  }, [selectedClassId]);

  const loadServants = useCallback(async () => {
    if (!serviceId) { setServants([]); return; }
    try {
      const res: any = await servantAssignmentsApi.getAll(String(serviceId));
      const list = (res?.data || res || []).filter((a: any) => a && a.id);
      setServants(list);
    } catch { setServants([]); }
  }, [serviceId]);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { loadStudents(); }, [loadStudents]);
  useEffect(() => { if (canPickResponsible || targetType === 'servant') loadServants(); }, [canPickResponsible, targetType, loadServants]);

  const toggle = (id: number) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleServantTarget = (id: number) => setSelectedServantTargets((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (targetType === 'servant') {
        // Flow B: secretary follows up with servants — class is meaningless
        if (selectedServantTargets.length === 0) { Alert.alert('', 'اختر خادماً واحداً على الأقل'); return; }
        await followUpsApi.create({ targetType: 'servant', memberIds: selectedServantTargets, serviceId: Number(serviceId), name: name || undefined, notes: notes || undefined });
      } else {
        if (selectedIds.length === 0) { Alert.alert('', 'اختر مخدوماً واحداً على الأقل'); return; }
        if (!selectedClassId) { Alert.alert('', 'اختر الفصل'); return; }
        await followUpsApi.create({
          classId: Number(selectedClassId), targetType, memberIds: selectedIds,
          name: name || undefined, notes: notes || undefined,
          ...(canPickResponsible && responsibleId ? { responsibleMemberId: responsibleId } : {}),
        });
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('', err?.response?.data?.message || err?.message || t('app.error'));
    } finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>{t('followUp.new')}</Text>
      </View>
      <View style={styles.waveContainer} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>النوع</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.chip, targetType === 'served_member' && styles.chipActive]} onPress={() => setTargetType('served_member')} activeOpacity={0.7}><Text style={[styles.chipText, targetType === 'served_member' && styles.chipTextActive]}>مخدوم</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.chip, targetType === 'servant' && styles.chipActive]} onPress={() => setTargetType('servant')} activeOpacity={0.7}><Text style={[styles.chipText, targetType === 'servant' && styles.chipTextActive]}>خادم</Text></TouchableOpacity>
        </View>

        {targetType === 'served_member' ? (
          <>
            {canPickResponsible && (
              <>
                <Text style={styles.label}>الخادم المسؤول</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {servants.map((s: any) => (
                    <TouchableOpacity key={s.churchMemberId} style={[styles.chip, responsibleId === Number(s.churchMemberId) && styles.chipActive]} onPress={() => setResponsibleId(Number(s.churchMemberId))} activeOpacity={0.7}>
                      <Text style={[styles.chipText, responsibleId === Number(s.churchMemberId) && styles.chipTextActive]}>{s.fullName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {servants.length === 0 && <Text style={styles.muted}>لا يوجد خدام في هذه الخدمة</Text>}
              </>
            )}

            <Text style={styles.label}>الفصل</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {classes.map((c: any) => (
                <TouchableOpacity key={c.id} style={[styles.chip, selectedClassId === String(c.id) && styles.chipActive]} onPress={() => setSelectedClassId(String(c.id))} activeOpacity={0.7}>
                  <Text style={[styles.chipText, selectedClassId === String(c.id) && styles.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>المخدومون ({students.length}) — اختر</Text>
            {students.map((s: any) => {
              const active = selectedIds.includes(Number(s.id));
              return (
                <TouchableOpacity key={s.id} style={[styles.memberRow, active && styles.memberRowActive]} onPress={() => toggle(Number(s.id))} activeOpacity={0.7}>
                  <Text style={styles.memberName}>{s.fullName}</Text>
                  <View style={[styles.check, active && styles.checkActive]}><Text style={styles.checkText}>{active ? '✓' : ''}</Text></View>
                </TouchableOpacity>
              );
            })}
            {students.length === 0 && <Text style={styles.muted}>لا يوجد مخدومين في هذا الفصل</Text>}
          </>
        ) : (
          <>
            <Text style={styles.label}>الخدام ({servants.length}) — اختر من ستتابعه</Text>
            {servants.map((s: any) => {
              const active = selectedServantTargets.includes(Number(s.churchMemberId));
              return (
                <TouchableOpacity key={s.churchMemberId} style={[styles.memberRow, active && styles.memberRowActive]} onPress={() => toggleServantTarget(Number(s.churchMemberId))} activeOpacity={0.7}>
                  <Text style={styles.memberName}>{s.fullName}{s.className ? ` • ${s.className}` : ''}</Text>
                  <View style={[styles.check, active && styles.checkActive]}><Text style={styles.checkText}>{active ? '✓' : ''}</Text></View>
                </TouchableOpacity>
              );
            })}
            {servants.length === 0 && <Text style={styles.muted}>لا يوجد خدام في هذه الخدمة</Text>}
          </>
        )}

        <Text style={styles.label}>اسم المجموعة (اختياري)</Text>
        <AppInput value={name} onChangeText={setName} placeholder="مثال: مجموعة ماركو - فصل 3أ" textAlign="right" />

        <AppInput label={t('followUp.notes')} value={notes} onChangeText={setNotes} multiline numberOfLines={3} textAlign="right" />
        <AppButton title={t('app.save')} onPress={handleSave} loading={saving} variant="navy" style={styles.saveBtn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, alignItems: 'center', justifyContent: 'center' },
  heading: { ...typography.subHeading, color: '#ffffff', textAlign: 'center' },
  waveContainer: { height: 30, backgroundColor: NAVY, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 0 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  label: { ...typography.caption, color: MUTED, marginTop: 12, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: NAVY, borderColor: NAVY },
  chipText: { ...typography.caption, color: MUTED },
  chipTextActive: { color: '#ffffff' },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 6 },
  memberRowActive: { borderColor: NAVY, backgroundColor: '#eef2f7' },
  memberName: { ...typography.body, color: NAVY, flex: 1, textAlign: 'right' },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  checkActive: { backgroundColor: NAVY, borderColor: NAVY },
  checkText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  muted: { ...typography.caption, color: MUTED, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
  saveBtn: { marginTop: 16 },
});
