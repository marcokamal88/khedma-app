import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { AppCard, AppBadge, AppButton, AppEmptyState } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

export default function PreparationsReviewScreen() {
  const { t } = useLocale();
  const [preparations, setPreparations] = useState<any[]>([]);

  useEffect(() => {
    setPreparations([]);
  }, []);

  const handleReview = async (id: string, status: string) => {
    // TODO: call PATCH /preparations/:id/review
  };

  const renderPrep = ({ item }: { item: any }) => (
    <AppCard variant="bordered" style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <AppBadge
        label={t('preparationReview.status') + item.status}
        variant="warning"
        style={styles.statusBadge}
      />
      <View style={styles.actions}>
        <AppButton
          title={t('preparationReview.approve')}
          onPress={() => handleReview(item.id, 'approved')}
          variant="success"
          size="sm"
          style={styles.actionBtn}
        />
        <AppButton
          title={t('preparationReview.reject')}
          onPress={() => handleReview(item.id, 'rejected')}
          variant="danger"
          size="sm"
          style={styles.actionBtn}
        />
      </View>
    </AppCard>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('preparationReview.title')}</Text>
      <FlatList
        data={preparations}
        keyExtractor={(item) => item.id}
        renderItem={renderPrep}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <AppEmptyState
            icon="check-circle"
            title={t('preparationReview.empty')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.md },
  heading: { ...typography.sectionHeading, color: colors.textPrimary, marginBottom: spacing.md },
  list: { gap: spacing.sm },
  card: {},
  title: { ...typography.cardTitle, color: colors.textPrimary, marginBottom: spacing.xs },
  statusBadge: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1 },
});
