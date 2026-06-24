import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { taioApi } from '../../api/taio.api';
import apiClient from '../../api/client';
import { useLocale } from '../../hooks/useLocale';
import { AppInput, AppButton } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

export default function TaioAwardScreen() {
  const { t } = useLocale();
  const [memberId, setMemberId] = useState('');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [serviceYearId, setServiceYearId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiClient.get('/service-years/current');
        const year = res?.data || res;
        if (year?.id) setServiceYearId(year.id);
      } catch {}
    })();
  }, []);

  const awardPoints = async () => {
    if (!serviceYearId) {
      Alert.alert(t('award.title'), t('errors.askPriest'));
      return;
    }
    try {
      await taioApi.awardPoints({
        churchMemberId: memberId,
        points: parseInt(points),
        reason,
        sourceType: 'manual',
        serviceYearId,
      });
      setMessage(t('award.success'));
      setMemberId('');
      setPoints('');
      setReason('');
    } catch (err: any) {
      setMessage(err?.message || t('award.failure'));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('award.title')}</Text>
      <AppInput
        placeholder={t('award.memberId')}
        value={memberId}
        onChangeText={setMemberId}
        textAlign="right"
      />
      <AppInput
        placeholder={t('award.points')}
        value={points}
        onChangeText={setPoints}
        keyboardType="numeric"
        textAlign="right"
      />
      <AppInput
        placeholder={t('award.reason')}
        value={reason}
        onChangeText={setReason}
        textAlign="right"
      />
      <AppButton
        title={t('award.button')}
        onPress={awardPoints}
        variant="success"
        size="lg"
        style={styles.button}
      />
      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.md },
  heading: { ...typography.sectionHeading, color: colors.textPrimary, marginBottom: spacing.lg },
  button: { marginTop: spacing.sm },
  message: { ...typography.body, color: colors.info, textAlign: 'center', marginTop: spacing.md, fontWeight: '500' },
});
