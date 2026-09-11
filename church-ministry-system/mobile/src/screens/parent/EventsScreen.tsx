import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { eventsApi } from '../../api/events.api';
import { useLocale } from '../../hooks/useLocale';
import { AppCard, AppButton, AppBadge, AppEmptyState } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

export default function ParentEventsScreen() {
  const { t } = useLocale();
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const data: any = await eventsApi.getAll();
    setEvents(data?.data || []);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

  const renderEvent = ({ item }: { item: any }) => (
    <AppCard variant="bordered" style={styles.card}>
      <AppBadge label={item.eventType} variant="info" style={styles.typeBadge} />
      <AppCard variant="bordered" style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.dates}>{item.startDate} - {item.endDate}</Text>
        {item.registrationFee > 0 && (
          <Text style={styles.fee}>{t('events.fee')}{item.registrationFee}</Text>
        )}
        <AppButton title={t('events.register')} onPress={() => {}} variant="success" size="sm" style={styles.registerBtn} />
      </AppCard>
    </AppCard>
  );

  return (
    <FlatList
      style={styles.container}
      data={events}
      keyExtractor={(item) => item.id}
      renderItem={renderEvent}
      contentContainerStyle={styles.list}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={
        <AppEmptyState icon="calendar" title={t('events.empty') || 'No events'} />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {},
  typeBadge: { alignSelf: 'flex-start', marginBottom: spacing.xs },
  cardContent: { flex: 1 },
  name: { ...typography.cardTitle, color: colors.textPrimary, marginBottom: spacing.xxs },
  dates: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xxs },
  fee: { ...typography.body, color: colors.error, fontWeight: '600', marginBottom: spacing.xxs },
  registerBtn: { alignSelf: 'flex-start', marginTop: spacing.xxs },
});
