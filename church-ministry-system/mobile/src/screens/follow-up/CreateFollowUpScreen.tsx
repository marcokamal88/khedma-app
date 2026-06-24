import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { followUpsApi } from '../../api/follow-ups.api';
import { AppInput, AppButton } from '../../components/ui';
import { colors, spacing } from '../../theme';

export default function CreateFollowUpScreen({ navigation }: any) {
  const { t } = useLocale();
  const [servantId, setServantId] = useState('');
  const [servedMemberId, setServedMemberId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!servantId || !servedMemberId) return;
    setSaving(true);
    try {
      await followUpsApi.create({ servantId, servedMemberId, serviceId: serviceId || undefined, notes });
      navigation.goBack();
    } catch (err) {
      console.error('Failed to create follow-up:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppInput
        label={t('followUp.servant')}
        value={servantId}
        onChangeText={setServantId}
        placeholder="معرف الخادم"
        textAlign="right"
      />
      <AppInput
        label={t('followUp.servedMember')}
        value={servedMemberId}
        onChangeText={setServedMemberId}
        placeholder="معرف المخدوم"
        textAlign="right"
      />
      <AppInput
        label={t('followUp.service')}
        value={serviceId}
        onChangeText={setServiceId}
        placeholder={t('followUp.service')}
        textAlign="right"
      />
      <AppInput
        label={t('followUp.notes')}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
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
  saveBtn: { marginTop: spacing.xl },
});
