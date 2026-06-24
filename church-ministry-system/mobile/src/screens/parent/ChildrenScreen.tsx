import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, I18nManager } from 'react-native';
import { familyApi } from '../../api/family.api';
import { useLocale } from '../../hooks/useLocale';
import { AppCard, AppEmptyState, AppAvatar } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface ChildMember {
  id: string;
  churchMemberId?: string;
  relation: string;
  child?: { fullName?: string; name?: string };
}

export default function ChildrenScreen({ navigation }: any) {
  const { t } = useLocale();
  const [children, setChildren] = useState<ChildMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await familyApi.getMyChildren();
      const raw = (res as any).data?.data || res.data || [];
      setChildren(raw);
    } catch (err) {
      console.warn('Failed to load children', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderChild = ({ item }: { item: ChildMember }) => {
    const memberId = item.churchMemberId || item.id;
    const name = item.child?.fullName || item.child?.name || memberId?.substring(0, 8) || '---';
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ChildDetail', { childId: memberId, childName: name })}
        activeOpacity={0.7}
      >
        <AppCard variant="bordered" style={styles.card}>
          <View style={styles.cardContent}>
            <AppAvatar name={name} size={40} />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.arrow}>{I18nManager.isRTL ? '→' : '←'}</Text>
          </View>
        </AppCard>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.charcoal} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        renderItem={renderChild}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <AppEmptyState icon="users" title={t('parent.noChildren')} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {},
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  name: { ...typography.body, fontWeight: '600', color: colors.textPrimary, flex: 1, marginStart: spacing.sm },
  arrow: { ...typography.bodyLarge, color: colors.mutedGray },
});
