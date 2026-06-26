import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { attendanceApi } from '../../api/attendance.api';
import apiClient from '../../api/client';
import { useLocale } from '../../hooks/useLocale';
import { AppInput, AppButton, AppCard, AppEmptyState, AppBadge } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

export default function AttendanceScreen() {
  const { t } = useLocale();
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [serviceYearId, setServiceYearId] = useState<string>('');
  const activeContext = useSelector((state: RootState) => state.auth.activeContext);
  const serviceId = activeContext?.serviceId;

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data: any = await attendanceApi.getSessions({ from: sessionDate, to: sessionDate });
      setSessions(data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiClient.get('/service-years/current');
        const year = res?.data || res;
        if (year?.id) setServiceYearId(year.id);
      } catch {}
    })();
  }, []);

  const createSession = async () => {
    if (!serviceId || !serviceYearId) {
      Alert.alert(t('attendance.missingContext'), t('attendance.missingContextMsg'));
      return;
    }
    await attendanceApi.createSession({
      serviceId: String(serviceId),
      serviceYearId: String(serviceYearId),
      sessionDate,
      sessionType: 'service',
    });
    loadSessions();
  };

  const renderSession = ({ item }: { item: any }) => (
    <AppCard variant="bordered" style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionDate}>{item.sessionDate}</Text>
        <AppBadge label={item.sessionType} variant="info" />
      </View>
      <Text style={styles.recordCount}>{t('attendance.records')}{item.records?.length || 0}</Text>
    </AppCard>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('attendance.title')}</Text>
      <AppInput
        value={sessionDate}
        onChangeText={setSessionDate}
        textAlign="right"
      />
      <AppButton
        title={t('attendance.createSession')}
        onPress={createSession}
        style={styles.createBtn}
      />
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        refreshing={loading}
        onRefresh={loadSessions}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <AppEmptyState
            icon="calendar"
            title={t('attendance.noSessions') || 'No sessions'}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.md },
  heading: { ...typography.sectionHeading, color: colors.textPrimary, marginBottom: spacing.md },
  createBtn: { marginBottom: spacing.md },
  list: { gap: spacing.sm },
  sessionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sessionDate: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  recordCount: { ...typography.caption, color: colors.textSecondary },
});
