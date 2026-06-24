import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { AppButton, AppCard } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

const reportTypes = ['attendance', 'engagement', 'financial', 'taio', 'servant-performance'] as const;

export default function ReportsScreen() {
  const { t } = useLocale();
  const [report, setReport] = useState<any>(null);

  const loadReport = async (type: string) => {
    setReport({ type, message: `Loading ${type} report...` });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>{t('reports.title')}</Text>
      <View style={styles.buttons}>
        {reportTypes.map((type) => (
          <AppButton
            key={type}
            title={t(`reports.${type}`)}
            onPress={() => loadReport(type)}
            variant="primary"
            size="md"
          />
        ))}
      </View>
      {report && (
        <AppCard variant="bordered" style={styles.reportCard}>
          <Text style={styles.reportText}>{JSON.stringify(report, null, 2)}</Text>
        </AppCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.md },
  heading: { ...typography.sectionHeading, color: colors.textPrimary, marginBottom: spacing.lg },
  buttons: { gap: spacing.sm, marginBottom: spacing.xl },
  reportCard: {},
  reportText: { ...typography.caption, color: colors.textPrimary },
});
