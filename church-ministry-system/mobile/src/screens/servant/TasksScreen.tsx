import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { tasksApi } from '../../api/tasks.api';
import { useLocale } from '../../hooks/useLocale';
import { typography, shadows } from '../../theme';
import AppHeader from '../../components/AppHeader';

const NAVY = '#192f5f';
const GOLD = '#d4a843';
const CREAM = '#f7f4ed';
const OFF_WHITE = '#fcfbf8';
const BORDER = '#eceae4';
const CHARCOAL = '#1c1c1c';
const MUTED = '#5f5f5d';
const GREEN = '#2e7d32';
const YELLOW = '#e6a817';
const RED = '#c62828';

const STATUS_COLORS: Record<string, string> = {
  completed: GREEN,
  pending: YELLOW,
  overdue: RED,
};

interface Task {
  id: string;
  title: string;
  taskType: string;
  dueDate?: string;
  status?: string;
  assignments?: { id: string; fullName?: string }[];
}

export default function TasksScreen() {
  const { t } = useLocale();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res: any = await tasksApi.getMyTasks();
      console.log('[TasksScreen] raw response:', JSON.stringify(res).slice(0, 1000));
      const rawList = res?.data || res || [];
      const list = Array.isArray(rawList) ? rawList : [];
      const mapped = list.map((a: any) => ({
        id: String(a.task?.id || a.id),
        title: a.task?.title || '',
        taskType: a.task?.taskType || '',
        dueDate: a.task?.dueDate,
        status: a.status,
      }));
      console.log('[TasksScreen] mapped tasks:', JSON.stringify(mapped));
      setTasks(mapped);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const markComplete = async (taskId: string) => {
    try {
      await tasksApi.complete(taskId);
      loadTasks();
    } catch {
      Alert.alert(t('app.error'), t('app.retry'));
    }
  };

  const renderTask = ({ item }: { item: Task }) => {
    const statusColor = STATUS_COLORS[item.status || ''] || MUTED;
    const isCompleted = item.status === 'completed';

    return (
      <View style={[styles.taskCard, isCompleted && styles.taskCardCompleted]}>
        <View style={styles.taskHeader}>
          <View style={styles.taskTypeBadge}>
            <Text style={styles.taskTypeText}>{item.taskType}</Text>
          </View>
          {item.status && (
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          )}
        </View>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <View style={styles.taskMeta}>
          <Text style={styles.dueDate}>
            {t('tasks.due')}{item.dueDate || t('tasks.noDeadline')}
          </Text>
          <Text style={styles.assignments}>
            {t('tasks.assignments')}{item.assignments?.length || 0}
          </Text>
        </View>
        {!isCompleted && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => markComplete(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.completeBtnText}>{t('tasks.markComplete')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <AppHeader greetingText={t('tasks.spiritualTasks')} />

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        refreshing={loading}
        onRefresh={loadTasks}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={NAVY} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{'\u2637'}</Text>
              <Text style={styles.emptyText}>{t('tasks.noTasks')}</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },

  list: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: { fontSize: 40, color: MUTED, marginBottom: 8, opacity: 0.4 },
  emptyText: { ...typography.body, color: MUTED },

  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    ...shadows.card,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardCompleted: { opacity: 0.7 },
  taskHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTypeBadge: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  taskTypeText: { ...typography.caption, color: '#1565c0', fontWeight: '700', fontSize: 11 },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskTitle: {
    ...typography.cardTitle,
    color: CHARCOAL,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dueDate: { ...typography.caption, color: MUTED },
  assignments: { ...typography.caption, color: '#1565c0', fontWeight: '500' },
  completeBtn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  completeBtnText: { ...typography.cardTitle, color: CHARCOAL, fontWeight: '700', fontSize: 13 },
});
