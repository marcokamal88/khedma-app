import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { activitiesApi } from '../../api/activities.api';
import { AppCard, AppEmptyState, AppBadge } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

const TYPE_LABELS: Record<string, string> = {
  choir: 'كورال', theater: 'مسرح', sports: 'رياضة', festival: 'مهرجان',
  educational: 'تعليمي', coptic: 'قبطي', memorization: 'حفظ', other: 'أخرى',
};

export default function ActivitiesListScreen({ navigation }: any) {
  const { t } = useLocale();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await activitiesApi.getAll();
      setActivities(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ActivityDetail', { id: item.id })}
      activeOpacity={0.7}
    >
      <AppCard variant="bordered" style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <AppBadge label={TYPE_LABELS[item.activityType] || item.activityType} variant="info" />
        </View>
        {item.description && <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>}
        <Text style={styles.cardParticipants}>
          {item.enrollments?.length || 0} {t('activities.participants')}
        </Text>
      </AppCard>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.charcoal} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <AppEmptyState icon="activity" title={t('app.noData')} />
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateActivity')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardTitle: { ...typography.cardTitle, color: colors.textPrimary, flex: 1 },
  cardDesc: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxs },
  cardParticipants: { ...typography.caption, color: colors.mutedGray },
  fab: {
    position: 'absolute', bottom: spacing.xl, left: spacing.xl,
    width: 56, height: 56,
    backgroundColor: colors.charcoal,
    borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  fabText: { color: colors.offWhite, fontSize: 28, lineHeight: 28 },
});
