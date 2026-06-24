import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { followUpsApi } from '../../api/follow-ups.api';
import { AppInput, AppButton } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

const ACTIVITY_TYPES = ['call', 'visit', 'meeting', 'message', 'other'];

export default function AddActivityScreen({ route, navigation }: any) {
  const { t } = useLocale();
  const { followUpId } = route.params;
  const [activityType, setActivityType] = useState('call');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState('');
  const [followUpAction, setFollowUpAction] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!summary.trim()) return;
    setSaving(true);
    try {
      await followUpsApi.addActivity(followUpId, { activityType, activityDate, summary, followUpAction });
      navigation.goBack();
    } catch (err) {
      console.error('Failed to add activity:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>{t('followUp.activityType')}</Text>
      <View style={styles.typeRow}>
        {ACTIVITY_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeBtn, activityType === type && styles.typeBtnActive]}
            onPress={() => setActivityType(type)}
          >
            <Text style={[styles.typeBtnText, activityType === type && styles.typeBtnTextActive]}>
              {t(`followUp.${type}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <AppInput
        label={t('followUp.date')}
        value={activityDate}
        onChangeText={setActivityDate}
        placeholder="YYYY-MM-DD"
        textAlign="right"
      />

      <AppInput
        label={t('followUp.summary')}
        value={summary}
        onChangeText={setSummary}
        multiline
        numberOfLines={4}
        textAlign="right"
      />

      <AppInput
        label={t('followUp.followUpAction')}
        value={followUpAction}
        onChangeText={setFollowUpAction}
        multiline
        numberOfLines={2}
        textAlign="right"
      />

      <AppButton
        title={t('app.save')}
        onPress={handleSave}
        loading={saving}
        disabled={saving}
        size="lg"
        style={styles.saveBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.md },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md, fontWeight: '600' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  typeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.charcoal4,
  },
  typeBtnActive: { backgroundColor: colors.charcoal },
  typeBtnText: { ...typography.caption, color: colors.textSecondary },
  typeBtnTextActive: { color: colors.offWhite },
  saveBtn: { marginTop: spacing.xl },
});
