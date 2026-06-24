import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { taioApi } from '../../api/taio.api';
import apiClient from '../../api/client';
import { useLocale } from '../../hooks/useLocale';
import { AppCard, AppButton, AppEmptyState } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function StoreScreen() {
  const { t } = useLocale();
  const [items, setItems] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [serviceYearId, setServiceYearId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiClient.get('/service-years/current');
        const year = res?.data || res;
        if (year?.id) setServiceYearId(year.id);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const load = async () => {
      const itemsData: any = await taioApi.getStoreItems();
      setItems(itemsData?.data || []);
      const bal: any = await taioApi.getBalance();
      setBalance(bal?.data?.balance || 0);
    };
    load();
  }, []);

  const redeem = async (itemId: string) => {
    if (!serviceYearId) {
      Alert.alert(t('store.noServiceYear'), t('store.askPriest'));
      return;
    }
    try {
      await taioApi.redeem({ itemId, quantity: 1, serviceYearId });
      Alert.alert(t('app.success'), t('store.redemptionRequested'));
    } catch (err: any) {
      Alert.alert(t('app.error'), err?.message || t('store.redemptionFailed'));
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const canAfford = balance >= item.pointCost;
    return (
      <AppCard variant="bordered" style={styles.itemCard}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCost}>{item.pointCost} {t('store.points')}</Text>
        <Text style={styles.itemStock}>
          {item.stockQuantity === -1 ? t('store.unlimited') : `${t('store.stock')}${item.stockQuantity}`}
        </Text>
        <AppButton
          title={t('store.redeem')}
          onPress={() => redeem(item.id)}
          variant={canAfford ? 'primary' : 'secondary'}
          disabled={!canAfford}
          size="sm"
          style={styles.redeemBtn}
        />
      </AppCard>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('store.title')}</Text>
      <AppCard variant="bordered" style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t('store.balance')}</Text>
        <Text style={styles.balanceValue}>{balance} {t('store.points')}</Text>
      </AppCard>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <AppEmptyState icon="shopping-bag" title={t('store.empty') || 'No items'} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.md },
  heading: { ...typography.sectionHeading, color: colors.textPrimary, marginBottom: spacing.sm },
  balanceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  balanceLabel: { ...typography.body, color: colors.textSecondary },
  balanceValue: { ...typography.subHeading, color: colors.success },
  row: { justifyContent: 'space-between', gap: spacing.sm },
  list: { gap: spacing.sm, paddingBottom: spacing.xxl },
  itemCard: { flex: 1, alignItems: 'center', padding: spacing.md },
  itemName: { ...typography.cardTitle, color: colors.textPrimary, textAlign: 'center' },
  itemCost: { ...typography.subHeading, color: colors.error, marginTop: spacing.sm },
  itemStock: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  redeemBtn: { marginTop: spacing.sm, width: '100%' },
});
