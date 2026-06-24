import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { AppInput, AppButton, AppCard, AppBadge, AppEmptyState } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

export default function PreparationScreen() {
  const { t } = useLocale();
  const [preparations, setPreparations] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);

  const createPreparation = async () => {
    if (!title) return;
    const newPrep = { id: Date.now().toString(), title, lessonDate, status: 'draft' };
    setPreparations([newPrep, ...preparations]);
    setTitle('');
  };

  const renderPrep = ({ item }: { item: any }) => (
    <AppCard variant="bordered" style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDate}>{item.lessonDate}</Text>
        </View>
        <AppBadge
          label={item.status}
          variant={item.status === 'approved' ? 'success' : 'warning'}
        />
      </View>
    </AppCard>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('preparation.heading')}</Text>
      <AppInput
        placeholder={t('preparation.titlePlaceholder')}
        value={title}
        onChangeText={setTitle}
        textAlign="right"
      />
      <AppInput
        value={lessonDate}
        onChangeText={setLessonDate}
        textAlign="right"
      />
      <AppButton
        title={t('preparation.add')}
        onPress={createPreparation}
        style={styles.addBtn}
      />
      <FlatList
        data={preparations}
        keyExtractor={(item) => item.id}
        renderItem={renderPrep}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <AppEmptyState
            icon="file-text"
            title={t('preparation.noPreparations') || 'No preparations'}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.md },
  heading: { ...typography.sectionHeading, color: colors.textPrimary, marginBottom: spacing.md },
  addBtn: { marginBottom: spacing.md },
  list: { gap: spacing.sm },
  card: {},
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardInfo: { flex: 1 },
  cardTitle: { ...typography.cardTitle, color: colors.textPrimary },
  cardDate: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
});
