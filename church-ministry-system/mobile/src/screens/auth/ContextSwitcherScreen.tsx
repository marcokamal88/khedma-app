import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';
import { AppButton, AppBadge } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function ContextSwitcherScreen() {
  const { t, isRTL } = useLocale();
  const { contexts, activeContext, switchContext, fetchContexts, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContexts();
  }, []);

  const handleSwitch = async (ctx: any) => {
    setLoading(true);
    await switchContext({ role: ctx.role, serviceId: ctx.serviceId });
    setLoading(false);
  };

  const renderContext = ({ item }: { item: any }) => {
    const isActive =
      activeContext?.role === item.role &&
      activeContext?.serviceId === item.serviceId;

    return (
      <TouchableOpacity
        onPress={() => handleSwitch(item)}
        disabled={isActive || loading}
        activeOpacity={0.7}
      >
        <View style={[styles.card, isActive && styles.activeCard]}>
          <View style={styles.cardContent}>
            <View style={styles.cardInfo}>
              <Text style={styles.roleLabel}>{item.role}</Text>
              {item.serviceName && (
                <Text style={styles.serviceName}>{item.serviceName}</Text>
              )}
              {item.className && (
                <Text style={styles.className}>{item.className}</Text>
              )}
            </View>
            {isActive && <AppBadge label={t('contextSwitcher.active')} variant="success" />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!contexts || contexts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.charcoal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('contextSwitcher.title')}</Text>
      </View>
      <FlatList
        data={contexts}
        keyExtractor={(_: any, index: number) => index.toString()}
        renderItem={renderContext}
        contentContainerStyle={styles.list}
        ListFooterComponent={() => (
          <AppButton
            title={t('contextSwitcher.logout')}
            onPress={logout}
            variant="ghost"
            size="lg"
            style={styles.logoutBtn}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream },
  header: { paddingTop: spacing.xxxxl, paddingBottom: spacing.xl },
  title: { ...typography.sectionHeading, color: colors.textPrimary },
  list: { gap: spacing.sm },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  activeCard: { borderColor: colors.charcoal },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: { flex: 1 },
  roleLabel: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  serviceName: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  className: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: { marginTop: spacing.xl },
});
