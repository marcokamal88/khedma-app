import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { tasksApi } from '../../api/tasks.api';
import { useLocale } from '../../hooks/useLocale';
import { typography, shadows } from '../../theme';
import AppHeader from '../../components/AppHeader';

const NAVY = '#192f5f';
const CREAM = '#f7f4ed';
const OFF_WHITE = '#fcfbf8';
const BORDER = '#eceae4';
const CHARCOAL = '#1c1c1c';
const MUTED = '#5f5f5d';
const GREEN = '#2e7d32';
const GOLD = '#d4a843';

export default function TaskDetailScreen({ route, navigation }: any) {
  const { t } = useLocale();
  const { taskId, title, dueDate, taskType, status } = route.params || {};
  const [completing, setCompleting] = useState(false);

  const isCompleted = status === 'completed';

  const markComplete = async () => {
    setCompleting(true);
    try {
      await tasksApi.complete(taskId);
      Alert.alert(t('app.success'), t('tasks.markComplete'));
      navigation.goBack();
    } catch {
      Alert.alert(t('app.error'), t('app.retry'));
    } finally {
      setCompleting(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader greetingText={t('tasks.spiritualTasks')} />
      <ScrollView style={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.card}>
            {taskType ? (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{taskType}</Text>
              </View>
            ) : null}

            <Text style={styles.title}>{title}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t('tasks.due')}</Text>
              <Text style={styles.metaValue}>{dueDate || t('tasks.noDeadline')}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t('tasks.status')}</Text>
              <Text style={[styles.metaValue, { color: isCompleted ? GREEN : MUTED }]}>
                {isCompleted ? t('app.success') : t('home.due')}
              </Text>
            </View>
          </View>

          {!isCompleted && (
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={markComplete}
              activeOpacity={0.7}
              disabled={completing}
            >
              {completing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.completeBtnText}>{t('tasks.markComplete')}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  scroll: { flex: 1 },
  content: { padding: 16 },
  card: {
    backgroundColor: OFF_WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    marginBottom: 16,
    ...shadows.card,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  typeBadgeText: { ...typography.caption, color: '#1565c0', fontWeight: '700', fontSize: 11 },
  title: { ...typography.sectionHeading, color: CHARCOAL, fontWeight: '700', marginBottom: 16 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  metaLabel: { ...typography.body, color: MUTED },
  metaValue: { ...typography.body, color: CHARCOAL, fontWeight: '600' },
  completeBtn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  completeBtnText: { ...typography.cardTitle, color: CHARCOAL, fontWeight: '700', fontSize: 14 },
});
