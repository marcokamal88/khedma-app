import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { taioApi } from '../../api/taio.api';
import { useLocale } from '../../hooks/useLocale';
import { AppCard, AppEmptyState } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

export default function TaioBalanceScreen() {
  const { t } = useLocale();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const bal: any = await taioApi.getBalance();
      setBalance(bal?.data?.balance || 0);
      const txs: any = await taioApi.getTransactions();
      setTransactions(txs?.data || []);
    };
    load();
  }, []);

  const renderTx = ({ item }: { item: any }) => (
    <AppCard variant="bordered" style={styles.txCard}>
      <Text style={[styles.points, item.points > 0 ? styles.earned : styles.redeemed]}>
        {item.points > 0 ? '+' : ''}{item.points}
      </Text>
      <View style={styles.txInfo}>
        <Text style={styles.reason}>{item.reason}</Text>
        <Text style={styles.date}>{item.createdAt?.split('T')[0]}</Text>
      </View>
    </AppCard>
  );

  return (
    <View style={styles.container}>
      <AppCard variant="bordered" style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t('home.myPoints')}</Text>
        <Text style={styles.balanceValue}>{balance}</Text>
      </AppCard>
      <Text style={styles.heading}>{t('store.title')}</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTx}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <AppEmptyState icon="credit-card" title={t('store.noTransactions') || 'No transactions'} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.md },
  balanceCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    marginBottom: spacing.xl,
  },
  balanceLabel: { ...typography.body, color: colors.textSecondary },
  balanceValue: {
    ...typography.displayHero,
    color: colors.success,
    marginTop: spacing.sm,
  },
  heading: { ...typography.subHeading, color: colors.textPrimary, marginBottom: spacing.md },
  list: { gap: spacing.sm },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  points: { ...typography.subHeading, width: 80 },
  earned: { color: colors.success },
  redeemed: { color: colors.error },
  txInfo: { flex: 1, marginStart: spacing.sm },
  reason: { ...typography.body, color: colors.textPrimary, fontWeight: '500' },
  date: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
