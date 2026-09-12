import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { followUpsApi } from '../../api/follow-ups.api';
import { AppInput, AppButton } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

const ACTIVITY_TYPES = ['call', 'visit', 'meeting', 'message', 'other'];

export default function AddActivityScreen({ route, navigation }: any) {
  const { t } = useLocale();
  const { followUpId, targetMemberId: presetTargetId } = route.params;
  const [family, setFamily] = useState<any>(null);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [logType, setLogType] = useState('call');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await followUpsApi.getOne(String(followUpId));
        const fam = res?.data || res;
        setFamily(fam);
        if (presetTargetId) {
          setTargetId(Number(presetTargetId));
        } else {
          const first = fam?.assignments?.[0];
          if (first) setTargetId(Number(first.targetMemberId || first.churchMemberId));
        }
      } catch {}
    })();
  }, [followUpId, presetTargetId]);

  const handleSave = async () => {
    if (!notes.trim() || !targetId) { Alert.alert('', 'اختر المخدوم واكتب الملاحظات'); return; }
    setSaving(true);
    try {
      await followUpsApi.addActivity(String(followUpId), { targetMemberId: targetId, logType, notes: notes.trim(), nextAction: nextAction.trim() || undefined, nextActionDate: nextActionDate.trim() || undefined });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('', err?.response?.data?.message || err?.message || t('app.error'));
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {family?.assignments?.length > 1 && !presetTargetId && (
        <>
          <Text style={styles.label}>المخدوم</Text>
          <View style={styles.typeRow}>
            {family.assignments.map((a: any) => {
              const nm = a.target?.user?.fullName || a.churchMember?.user?.fullName || `#${a.targetMemberId}`;
              return (
                <TouchableOpacity key={a.targetMemberId} style={[styles.typeBtn, targetId === Number(a.targetMemberId) && styles.typeBtnActive]} onPress={() => setTargetId(Number(a.targetMemberId))} activeOpacity={0.7}>
                  <Text style={[styles.typeBtnText, targetId === Number(a.targetMemberId) && styles.typeBtnTextActive]}>{nm}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
      {presetTargetId ? (
        <Text style={styles.label}>المخدوم: {family?.assignments?.find((a: any) => Number(a.targetMemberId) === Number(presetTargetId))?.target?.user?.fullName || ''}</Text>
      ) : null}
      <Text style={styles.label}>{t('followUp.activityType')}</Text>
      <View style={styles.typeRow}>
        {ACTIVITY_TYPES.map((type) => (
          <TouchableOpacity key={type} style={[styles.typeBtn, logType === type && styles.typeBtnActive]} onPress={() => setLogType(type)} activeOpacity={0.7}>
            <Text style={[styles.typeBtnText, logType === type && styles.typeBtnTextActive]}>{t(`followUp.${type}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <AppInput label={t('followUp.summary')} value={notes} onChangeText={setNotes} multiline numberOfLines={4} textAlign="right" />
      <AppInput label={t('followUp.followUpAction')} value={nextAction} onChangeText={setNextAction} multiline numberOfLines={2} textAlign="right" />
      <AppInput label={t('followUp.date')} value={nextActionDate} onChangeText={setNextActionDate} placeholder="YYYY-MM-DD" textAlign="right" />
      <AppButton title={t('app.save')} onPress={handleSave} loading={saving} variant="navy" style={styles.saveBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.md },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md, fontWeight: '600', textAlign: 'right' },
  typeRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  typeBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.charcoal4 },
  typeBtnActive: { backgroundColor: colors.navy },
  typeBtnText: { ...typography.caption, color: colors.textSecondary },
  typeBtnTextActive: { color: colors.offWhite },
  saveBtn: { marginTop: spacing.xl },
});
