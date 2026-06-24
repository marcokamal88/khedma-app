import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, I18nManager } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { AppListItem, AppEmptyState } from '../../components/ui';
import { colors, spacing } from '../../theme';

export default function NotificationsScreen() {
  const { t } = useLocale();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    setNotifications([]);
  }, []);

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
