import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, I18nManager } from 'react-native';
import { achievementsApi } from '../../api/achievements.api';
import { useLocale } from '../../hooks/useLocale';
import { AppButton, AppCard, AppBadge, AppEmptyState } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteriaType: string;
  criteriaValue: number;
  taioPoints: number;
  isActive: boolean;
  earned?: boolean;
  earnedAt?: string;
}

export default function AchievementsScreen() {
  const { t } = useLocale();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [myAchievementIds, setMyAchievementIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [allRes, mineRes] = await Promise.all([
        achievementsApi.getAll(),
        achievementsApi.getMine(),
      ]);
      const all = (allRes as any).data?.data || allRes.data || [];
      const mine = (mineRes as any).data?.data || mineRes.data || [];
      const earnedIds = new Set<string>(mine.map((m: any) => m.achievementId || m.id));
      setAchievements(all);
      setMyAchievementIds(earnedIds);
    } catch (err) {
      console.warn('Failed to load achievements', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCheckAndAward = async () => {
    try {
      setChecking(true);
      await achievementsApi.checkAndAward();
      await load();
    } catch (err) {
      console.warn('Check and award failed', err);
    } finally {
      setChecking(false);
    }
  };

  const renderItem = ({ item }: { item: Achievement }) => {
    const earned = myAchievementIds.has(item.id);
    return (
      <AppCard
        variant={earned ? 'highlighted' : 'bordered'}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>{item.icon || '🏆'}</Text>
          <Text style={styles.name}>{item.name}</Text>
          {earned && <AppBadge label={t('achievements.earned')} variant="success" />}
        </View>
        {item.description && <Text style={styles.description}>{item.description}</Text>}
        <Text style={styles.meta}>
          {item.criteriaType}: {item.criteriaValue} | {item.taioPoints} {t('achievements.points')}
        </Text>
      </AppCard>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.charcoal} /></View>;
  }

  return (
    <View style={styles.container}>
      <AppButton
        title={checking ? t('achievements.checking') : t('achievements.checkNow')}
        onPress={handleCheckAndAward}
        disabled={checking}
        loading={checking}
        style={styles.checkBtn}
      />
      <FlatList
        data={achievements}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <AppEmptyState icon="award" title={t('achievements.empty')} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {},
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  icon: { fontSize: 28, marginEnd: spacing.sm },
  name: { ...typography.cardTitle, color: colors.textPrimary, flex: 1 },
  description: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
  meta: { ...typography.caption, color: colors.mutedGray },
  checkBtn: { margin: spacing.md },
});
