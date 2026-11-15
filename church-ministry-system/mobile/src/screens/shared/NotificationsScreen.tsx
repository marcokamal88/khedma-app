import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useLocale } from '../../hooks/useLocale';
import { notificationsApi } from '../../api/notifications.api';
import { setNotifications, setUnreadCount, markAsRead as markAsReadAction, markAllAsRead as markAllAsReadAction } from '../../store/notifications.slice';
import { AppEmptyState } from '../../components/ui';
import AppHeader from '../../components/AppHeader';
import { colors, typography, spacing, shadows } from '../../theme';

const NAVY = colors.navy;
const CREAM = colors.cream;
const CHARCOAL = colors.charcoal;
const MUTED = colors.mutedGray;
const BORDER = colors.border;
const OFF_WHITE = colors.offWhite;

const TYPE_CONFIG: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  task: { bg: '#e3f2fd', text: '#1565c0', icon: '\uD83D\uDCCB', label: 'مهمة' },
  preparation: { bg: '#fff3e0', text: '#e65100', icon: '\uD83D\uDCDD', label: 'تحضير' },
  followup: { bg: '#e8f5e9', text: '#2e7d32', icon: '\uD83D\uDC65', label: 'افتقاد' },
  event: { bg: '#fce4ec', text: '#c62828', icon: '\uD83D\uDCC5', label: 'فعالية' },
  payment: { bg: '#f3e5f5', text: '#7b1fa2', icon: '\uD83D\uDCB3', label: 'دفعة' },
  general: { bg: '#eceae4', text: '#5f5f5d', icon: '\uD83D\uDD14', label: 'عام' },
};

const SOURCE_ROUTES: Record<string, { name?: string; params?: (id: string) => any; fallback?: string }> = {
  task: { name: 'TaskDetail', params: (id) => ({ id }), fallback: 'Tasks' },
  preparation: { name: 'Preparations' },
  followup: { name: 'FollowUpDetail', params: (id) => ({ id }) },
  event: { name: 'Events' },
  payment: { name: 'Events' },
  general: {},
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

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
    const route = SOURCE_ROUTES[item.sourceType];
    if (!route?.name) return;
    try {
      const params = item.sourceId && route.params ? route.params(String(item.sourceId)) : undefined;
      navigation.navigate(route.name, params);
    } catch {
      try { if (route.fallback) navigation.navigate(route.fallback); } catch {}
    }
  };

  const readAll = async () => {
    try {
      await notificationsApi.markAllAsRead();
      dispatch(markAllAsReadAction());
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const unreadCount = items.filter((n) => !n.isRead).length;

  const renderNotificationCard = ({ item }: { item: any }) => {
    const cfg = TYPE_CONFIG[item.sourceType] || TYPE_CONFIG.general;
    const isUnread = !item.isRead;
    const cardBg = isUnread ? '#eef3fb' : '#ffffff';
    const cardBorder = isUnread ? NAVY : BORDER;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
        onPress={() => openNotification(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.typeIcon, { color: cfg.text }]}>{cfg.icon}</Text>
            <Text style={[styles.typeText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
          {isUnread && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        {item.body && <Text style={styles.body} numberOfLines={3}>{item.body}</Text>}

        <View style={styles.metaRow}>
          <Text style={styles.dateText}>{formatDate(item.sentAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AppHeader
        greetingText={t('notifications.title')}
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={readAll} activeOpacity={0.7}>
              <Text style={styles.readAllBtn}>{t('notifications.readAll')}</Text>
            </TouchableOpacity>
          ) : null
        }
      >
        <View style={styles.card} />
      </AppHeader>

      <FlatList
        data={items}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={renderNotificationCard}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <AppEmptyState icon="bell" title={t('notifications.empty')} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CREAM },

  list: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 12 },

  card: {
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
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  typeIcon: { fontSize: 13 },
  typeText: { ...typography.overline, fontWeight: '700', fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: NAVY },

  title: { ...typography.cardTitle, color: CHARCOAL, fontWeight: '700', marginBottom: 6, textAlign: 'right' },
  body: { ...typography.body, color: CHARCOAL, lineHeight: 22, textAlign: 'right' },

  metaRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: BORDER },
  dateText: { ...typography.caption, color: MUTED },

  readAllBtn: { ...typography.buttonSmall, color: NAVY, fontWeight: '600' },
});