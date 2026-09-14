import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { useLocale } from '../../hooks/useLocale';
import { notificationsApi } from '../../api/notifications.api';
import { setNotifications, setUnreadCount, markAsRead as markAsReadAction, markAllAsRead as markAllAsReadAction } from '../../store/notifications.slice';
import { AppListItem, AppEmptyState, AppButton } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

const SOURCE_ROUTES: Record<string, { name?: string; params?: (id: string) => any; fallback?: string }> = {
  task: { name: 'TaskDetail', params: (id) => ({ id }), fallback: 'Tasks' },
  preparation: { name: 'Preparations' },
  followup: { name: 'FollowUpDetail', params: (id) => ({ id }) },
  event: { name: 'Events' },
  payment: { name: 'Events' },
  general: {},
};

export default function NotificationsScreen({ navigation }: any) {
  const { t } = useLocale();
  const dispatch = useDispatch();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [listRes, countRes]: any[] = await Promise.all([
        notificationsApi.getAll().catch(() => ({ data: [] })),
        notificationsApi.unreadCount().catch(() => ({ data: { unreadCount: 0 } })),
      ]);
      const list = Array.isArray(listRes) ? listRes : listRes?.data || [];
      const count = countRes?.data?.unreadCount ?? countRes?.unreadCount ?? 0;
      setItems(Array.isArray(list) ? list : []);
      dispatch(setNotifications(Array.isArray(list) ? list : []));
      dispatch(setUnreadCount(Number(count) || 0));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

  const openNotification = async (item: any) => {
    if (!item.isRead) {
      try {
        await notificationsApi.markAsRead(String(item.id));
        dispatch(markAsReadAction(String(item.id)));
        setItems((prev) => prev.map((n) => (String(n.id) === String(item.id) ? { ...n, isRead: true } : n)));
      } catch {}
    }
    // Deep link by source; not every stack owns every route — fall back silently.
    const route = SOURCE_ROUTES[item.sourceType];
    if (!route?.name) return;
    try {
      const params = item.sourceId && route.params ? route.params(String(item.sourceId)) : undefined;
      navigation.navigate(route.name, params);
    } catch {
      try {
        if (route.fallback) navigation.navigate(route.fallback);
      } catch {}
    }
  };

  const readAll = async () => {
    try {
      await notificationsApi.markAllAsRead();
      dispatch(markAllAsReadAction());
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const renderNotification = ({ item }: { item: any }) => (
    <AppListItem
      title={item.title}
      subtitle={`${item.body}\n${String(item.sentAt || '').split('T')[0] || ''}`}
      onPress={() => openNotification(item)}
      unread={!item.isRead}
    />
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.navy} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>{t('notifications.title')}</Text>
        {items.some((n) => !n.isRead) && (
          <TouchableOpacity onPress={readAll} activeOpacity={0.7}>
            <Text style={styles.readAll}>تحديد الكل كمقروء</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={items}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={renderNotification}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <AppEmptyState icon="bell" title={t('notifications.empty')} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.md },
  heading: { ...typography.sectionHeading, color: colors.textPrimary },
  readAll: { ...typography.buttonSmall, color: colors.navy, fontWeight: '700' },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
});
