import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { tasksApi } from '../../api/tasks.api';
import { useLocale } from '../../hooks/useLocale';
import { AppCard, AppBadge, AppButton, AppEmptyState } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

export default function ServedMemberTasksScreen() {
  const { t } = useLocale();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data: any = await tasksApi.getMyTasks();
      setTasks(data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const completeTask = async (taskId: string) => {
    await tasksApi.complete(taskId);
    loadTasks();
  };

  const renderTask = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'completed';
    return (
      <AppCard variant="bordered" style={styles.card}>
        <AppBadge
          label={isCompleted ? t('tasks.completed') : t('tasks.pending')}
          variant={isCompleted ? 'success' : 'warning'}
          style={styles.statusBadge}
        />
        <Text style={styles.title}>{item.task?.title}</Text>
        {!isCompleted && (
          <AppButton
            title={t('tasks.markComplete')}
            onPress={() => completeTask(item.taskId)}
            variant="success"
            size="sm"
            style={styles.completeBtn}
          />
        )}
      </AppCard>
    );
  };

  return (
    <FlatList
      style={styles.container}
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={renderTask}
      refreshing={loading}
      onRefresh={loadTasks}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <AppEmptyState icon="check-square" title={t('app.noData')} />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  list: { padding: spacing.md, gap: spacing.sm },
  card: { position: 'relative' },
  statusBadge: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  title: { ...typography.cardTitle, color: colors.textPrimary },
  completeBtn: { alignSelf: 'flex-start', marginTop: spacing.sm },
});
