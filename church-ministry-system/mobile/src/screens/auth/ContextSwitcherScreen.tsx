import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';
import { colors, typography, spacing } from '../../theme';

const roleToLocaleKey = (role: string) =>
  role.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

export default function ContextSwitcherScreen() {
  const { t, isRTL } = useLocale();
  const { contexts, activeContext, fetchContexts, switchContext, logout } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  useEffect(() => {
    fetchContexts();
  }, []);

  const handleSwitch = useCallback(async (ctx: any) => {
    const key = `${ctx.role}_${ctx.serviceId || ''}`;
    setSwitchingId(key);
    try {
      await switchContext({ role: ctx.role, serviceId: ctx.serviceId });
    } catch {
      setSwitchingId(null);
    }
  }, [switchContext]);

  if (!contexts || contexts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.offWhite} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>+</Text>
        </View>
        <Text style={styles.appName}>{t('app.name')}</Text>
      </View>

      <View style={styles.cardWrapper}>
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>
            {t('home.greeting')}{user?.fullName}
          </Text>
          <Text style={styles.sectionTitle}>{t('contextSwitcher.title')}</Text>
          <Text style={styles.description}>{t('contextSwitcher.subtitle')}</Text>
        </View>

        <FlatList
          data={contexts}
          keyExtractor={(item: any, index: number) =>
            `${item.role}_${item.serviceId || ''}_${index}`
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: any }) => {
            const itemKey = `${item.role}_${item.serviceId || ''}`;
            const isSwitching = switchingId === itemKey;
            const isActive = activeContext?.role === item.role && activeContext?.serviceId === item.serviceId;

            return (
              <TouchableOpacity
                onPress={() => handleSwitch(item)}
                activeOpacity={0.7}
                disabled={isSwitching}
              >
                <View style={[styles.card, isActive && styles.cardActive]}>
                  <View style={styles.cardContent}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.roleLabel}>
                        {t(`roles.${roleToLocaleKey(item.role)}`) || item.role}
                      </Text>
                      {item.serviceName && (
                        <Text style={styles.serviceName}>{item.serviceName}</Text>
                      )}
                      {item.className && (
                        <Text style={styles.className}>{item.className}</Text>
                      )}
                    </View>
                    <View style={styles.arrowContainer}>
                      {isSwitching ? (
                        <ActivityIndicator size="small" color={colors.charcoal} />
                      ) : (
                        <Text style={styles.arrow}>
                          {isRTL ? '\u2039' : '\u203A'}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Text style={styles.logoutText}>{t('contextSwitcher.logout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#192f5f',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#192f5f',
  },
  brand: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#f2c94c',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 4,
  },
  logoText: {
    fontSize: 28,
    color: colors.charcoal,
  },
  appName: {
    ...typography.sectionHeading,
    color: colors.offWhite,
    textAlign: 'center',
  },
  cardWrapper: {
    flex: 1,
    width: '92%',
    alignSelf: 'center',
    borderRadius: 34,
    padding: spacing.xl,
    backgroundColor: colors.offWhite,
    marginTop: spacing.sm,
    marginBottom: spacing.xxxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  headerRow: {
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.subHeading,
    color: colors.charcoal,
    textAlign: 'left',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.subHeading,
    color: colors.charcoal,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  list: {
    flexGrow: 1,
    paddingBottom: spacing.sm,
  },
  card: {
    backgroundColor: '#f5f3ee',
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#e8e4d8',
  },
  cardActive: {
    borderColor: '#1f2d56',
    borderWidth: 2,
    backgroundColor: '#eef0f5',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
  },
  roleLabel: {
    ...typography.cardTitle,
    color: colors.charcoal,
    textTransform: 'capitalize',
  },
  serviceName: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  className: {
    ...typography.caption,
    color: colors.mutedGray,
    marginTop: 2,
  },
  arrowContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 22,
    color: colors.mutedGray,
  },
  logoutBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
  },
  logoutText: {
    ...typography.button,
    color: '#1f2d56',
    textAlign: 'center',
  },
});
