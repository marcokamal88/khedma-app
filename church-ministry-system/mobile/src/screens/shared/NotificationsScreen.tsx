import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, StyleSheet, I18nManager } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { AppListItem, AppEmptyState } from '../../components/ui';
import { colors, spacing } from '../../theme';

export default function NotificationsScreen() {
  const { t } = useLocale();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setNotifications([]);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await new Promise((r) => setTimeout(r, 500)); await loadData(); setRefreshing(false); }, [loadData]);

  const markAsRead = async (id: string) => {
    // TODO: PATCH /notifications/:id/read
  };

  const renderNotification = ({ item }: { item: any }) => (
    <AppListItem
      title={item.title}
      subtitle={`${item.body}\n${item.sentAt?.split('T')[0] || ''}`}
      onPress={() => markAsRead(item.id)}
    />
  );

  return (
    <FlatList
      style={styles.container}
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={renderNotification}
      contentContainerStyle={styles.list}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={
        <AppEmptyState icon="bell" title={t('notifications.empty')} />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  list: { paddingTop: spacing.md },
});
