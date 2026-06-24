import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { lessonLibraryApi } from '../../api/lesson-library.api';
import { AppInput, AppCard, AppEmptyState } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

const CATEGORIES = ['bible', 'hymn', 'catechism', 'liturgy', 'spiritual', 'activity', 'other'];

const CATEGORY_LABELS: Record<string, string> = {
  bible: 'الكتاب المقدس', hymn: 'ترانيم', catechism: 'تعليم', liturgy: 'طقس',
  spiritual: 'روحي', activity: 'نشاط', other: 'أخرى',
};

export default function LessonLibraryScreen() {
  const { t } = useLocale();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit: 20 };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await lessonLibraryApi.getAll(params);
      const data = res as any;
      setLessons(data.lessons || []);
      setTotalPages(data.totalPages || 1);
      setPage(p);
    } catch (err) {
      console.error('Failed to load lessons:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { loadData(); }, [loadData]);

  const renderItem = ({ item }: any) => (
    <AppCard variant="bordered" style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardMeta}>
        {item.service?.name} | {CATEGORY_LABELS[item.category] || item.category}
      </Text>
      {item.description && (
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      )}
    </AppCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <AppInput
          placeholder="بحث..."
          value={search}
          onChangeText={setSearch}
          textAlign="right"
          style={styles.searchInput}
        />
      </View>

      <FlatList
        horizontal
        data={['', ...CATEGORIES]}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        renderItem={({ item: cat }) => (
          <View
            style={[
              styles.filterChip,
              category === cat && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                category === cat && styles.filterChipTextActive,
              ]}
            >
              {cat ? CATEGORY_LABELS[cat] : 'الكل'}
            </Text>
          </View>
        )}
      />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.charcoal} /></View>
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <AppEmptyState icon="book" title={t('app.noData')} />
          }
          onEndReached={() => page < totalPages && loadData(page + 1)}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchRow: { padding: spacing.sm },
  searchInput: { marginBottom: 0 },
  filterRow: { maxHeight: 44, marginHorizontal: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.charcoal4,
    marginEnd: spacing.sm,
  },
  filterChipActive: { backgroundColor: colors.charcoal },
  filterChipText: { ...typography.caption, color: colors.textSecondary },
  filterChipTextActive: { color: colors.offWhite },
  list: { padding: spacing.sm, gap: spacing.sm },
  card: {},
  cardTitle: { ...typography.cardTitle, color: colors.textPrimary, marginBottom: spacing.xxs },
  cardMeta: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xxs },
  cardDesc: { ...typography.body, color: colors.textSecondary },
});
