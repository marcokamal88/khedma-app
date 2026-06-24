import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { followUpsApi } from '../../api/follow-ups.api';
import { AppCard, AppButton, AppBadge } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

const ACTIVITY_ICONS: Record<string, string> = {
  call: '📞', visit: '🏠', meeting: '🤝', message: '💬', other: '📌',
};

export default function FollowUpDetailScreen({ route, navigation }: any) {
  const { t } = useLocale();
  const { id } = route.params;
  const [followUp, setFollowUp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await followUpsApi.getOne(id);
      setFollowUp(res);
    } catch (err) {
      console.error('Failed to load follow-up:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = async (status: string) => {
    try {
      await followUpsApi.updateStatus(id, status);
      setFollowUp((prev: any) => ({ ...prev, status }));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.charcoal} /></View>;
  }

  if (!followUp) {
    return <View style={styles.center}><AppCard variant="bordered"><Text>{t('app.noData')}</Text></AppCard></View>;
  }

  const statusOptions = ['active', 'paused', 'completed'];

  return (
    <View style={styles.container}>
      <AppCard variant="bordered" style={styles.header}>
        <Text style={styles.title}>{followUp.servedMember?.fullName}</Text>
        <Text style={styles.meta}>{t('followUp.servant')}: {followUp.servant?.fullName}</Text>
        <Text style={styles.meta}>{followUp.service?.name}</Text>
        <View style={styles.statusRow}>
          {statusOptions.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.statusBtn, followUp.status === s && styles.statusBtnActive]}
              onPress={() => handleStatusChange(s)}
            >
              <Text style={[styles.statusBtnText, followUp.status === s && styles.statusBtnTextActive]}>
                {t(`followUp.${s}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </AppCard>

      <FlatList
        data={followUp.activities || []}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: any) => (
          <AppCard variant="bordered" style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityIcon}>{ACTIVITY_ICONS[item.activityType] || '📌'}</Text>
              <Text style={styles.activityType}>{t(`followUp.${item.activityType}`)}</Text>
              <Text style={styles.activityDate}>{item.activityDate}</Text>
            </View>
            <Text style={styles.activitySummary}>{item.summary}</Text>
            {item.followUpAction && (
              <Text style={styles.activityAction}>{t('followUp.followUpAction')}: {item.followUpAction}</Text>
            )}
          </AppCard>
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={() => (
          <AppButton
            title={`+ ${t('followUp.addActivity')}`}
            onPress={() => navigation.navigate('AddActivity', { followUpId: id })}
            variant="secondary"
            style={styles.addBtn}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream },
  header: { margin: spacing.md, marginBottom: 0 },
  title: { ...typography.subHeading, color: colors.textPrimary, marginBottom: spacing.xxs },
  meta: { ...typography.body, color: colors.textSecondary, marginBottom: 2 },
  statusRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  statusBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.charcoal4,
  },
  statusBtnActive: { backgroundColor: colors.charcoal },
  statusBtnText: { ...typography.caption, color: colors.textSecondary },
  statusBtnTextActive: { color: colors.offWhite },
  list: { padding: spacing.md, gap: spacing.sm },
  addBtn: { marginBottom: spacing.sm },
  activityCard: {},
  activityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  activityIcon: { fontSize: 20, marginEnd: spacing.sm },
  activityType: { ...typography.body, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  activityDate: { ...typography.caption, color: colors.textSecondary },
  activitySummary: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xxs },
  activityAction: { ...typography.caption, color: colors.info, fontStyle: 'italic' },
});
