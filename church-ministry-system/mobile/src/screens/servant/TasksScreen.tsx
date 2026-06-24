import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { tasksApi } from '../../api/tasks.api';
import { useLocale } from '../../hooks/useLocale';
import { AppCard, AppEmptyState, AppBadge } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

export default function TasksScreen() {
  const { t } = useLocale();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data: any = await tasksApi.getAll();
      setTasks(data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const renderTask = ({ item }: { item: any }) => (
    <AppCard variant="bordered" style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.metaRow}>
        <AppBadge label={item.taskType} variant="info" />
        <Text style={styles.dueDate}>
          {t('tasks.due')}{item.dueDate || t('tasks.noDeadline')}
        </Text>
      </View>
      <Text style={styles.assignments}>
        {t('tasks.assignments')}{item.assignments?.length || 0}
      </Text>
    </AppCard>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('tasks.spiritualTasks')}</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        refreshing={loading}
        onRefresh={loadTasks}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <AppEmptyState
            icon="check-square"
            title={t('tasks.noTasks') || 'No tasks'}
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxs,
  },
  dueDate: { ...typography.caption, color: colors.textSecondary },
  assignments: { ...typography.caption, color: colors.info, fontWeight: '500' },
});
