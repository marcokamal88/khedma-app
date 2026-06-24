import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { followUpsApi } from '../../api/follow-ups.api';
import { AppCard, AppBadge, AppEmptyState } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function FollowUpListScreen({ navigation }: any) {
  const { t } = useLocale();
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await followUpsApi.getAll();
      setFollowUps(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const statusVariant = (s: string) => {
    if (s === 'active') return 'success' as const;
    if (s === 'paused') return 'warning' as const;
    return 'info' as const;
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('FollowUpDetail', { id: item.id })}
      activeOpacity={0.7}
    >
      <AppCard variant="bordered" style={styles.card}>
        <AppBadge
          label={t(`followUp.${item.status}`)}
          variant={statusVariant(item.status)}
          style={styles.statusBadge}
        />
        <Text style={styles.cardTitle}>{item.servedMember?.fullName || t('app.noData')}</Text>
        <Text style={styles.cardSubtitle}>{item.service?.name}</Text>
        <Text style={styles.cardMeta}>{item.activities?.length || 0} {t('followUp.activities')}</Text>
      </AppCard>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.charcoal} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={followUps}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <AppEmptyState icon="users" title={t('app.noData')} />
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateFollowUp')}
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
  card: { position: 'relative' },
  statusBadge: { alignSelf: 'flex-start', marginBottom: spacing.xs },
  cardTitle: { ...typography.cardTitle, color: colors.textPrimary, marginBottom: spacing.xxs },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xxs },
  cardMeta: { ...typography.caption, color: colors.mutedGray },
  fab: {
    position: 'absolute', bottom: spacing.xl, left: spacing.xl,
    width: 56, height: 56,
    backgroundColor: colors.charcoal,
    borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
});
