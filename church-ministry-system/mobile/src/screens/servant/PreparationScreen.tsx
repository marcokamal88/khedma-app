import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { AppInput, AppButton, AppCard, AppBadge, AppEmptyState } from '../../components/ui';
import { preparationsApi } from '../../api/preparations.api';
import { colors, typography, spacing, shadows } from '../../theme';

const NAVY = colors.navy;

export default function PreparationScreen() {
  const { t } = useLocale();
  const [preparations, setPreparations] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await preparationsApi.getAll();
      setPreparations(res?.data || res || []);
    } catch { setPreparations([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

  const createPreparation = async () => {
    if (!title.trim()) { Alert.alert('', t('preparation.titlePlaceholder')); return; }
    try {
      const description = JSON.stringify({ keyPoints: [title.trim()], bibleVerses: [] });
      await preparationsApi.create({ title: title.trim(), lessonDate, description, status: 'draft' });
      setTitle('');
      Alert.alert('', t('preparation.created') || 'تم الإنشاء');
      loadData();
    } catch (err: any) { Alert.alert('', err?.message || t('app.error')); }
  };

  const pickAndUpload = async (prepId: string, type: 'image' | 'pdf') => {
    Alert.alert('', 'رفع الملفات سيُتاح بعد إعادة بناء التطبيق (npx expo run:android). حالياً يمكنك إنشاء التحضير نصاً ومراجعته من لوحة التحضير.');
  };

  const renderPrep = ({ item }: { item: any }) => {
    const files = item.files || [];
    return (
      <AppCard variant="bordered" style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDate}>{item.lessonDate}</Text>
            {files.length > 0 && <Text style={styles.fileHint}>{files.length} {t('preparation.files') || 'ملفات'}</Text>}
          </View>
          <AppBadge label={item.status} variant={item.status === 'approved' ? 'success' : 'warning'} />
        </View>
        <View style={styles.fileRow}>
          <TouchableOpacity style={styles.pickBtn} onPress={() => pickAndUpload(String(item.id), 'image')} activeOpacity={0.7} disabled={uploading}>
            <Text style={styles.pickBtnText}>{t('preparation.pickImage') || 'صورة'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pickBtn, styles.pickBtnPdf]} onPress={() => pickAndUpload(String(item.id), 'pdf')} activeOpacity={0.7} disabled={uploading}>
            <Text style={styles.pickBtnText}>{t('preparation.pickPdf') || 'PDF'}</Text>
          </TouchableOpacity>
        </View>
        {files.length > 0 && (
          <View style={styles.fileList}>
            {files.map((f: any) => (
              <View key={f.id} style={styles.fileChip}>
                <Text style={styles.fileName} numberOfLines={1}>{f.file_name}</Text>
              </View>
            ))}
          </View>
        )}
      </AppCard>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('preparation.heading')}</Text>
      <AppInput placeholder={t('preparation.titlePlaceholder')} value={title} onChangeText={setTitle} textAlign="right" />
      <AppInput value={lessonDate} onChangeText={setLessonDate} textAlign="right" />
      <AppButton title={t('preparation.add')} onPress={createPreparation} style={styles.addBtn} />
      {uploading && <ActivityIndicator color={NAVY} style={{ marginBottom: 8 }} />}
      <FlatList
        data={preparations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPrep}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<AppEmptyState icon="file-text" title={t('preparation.noPreparations') || 'No preparations'} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.md },
  heading: { ...typography.sectionHeading, color: colors.textPrimary, marginBottom: spacing.md },
  addBtn: { marginBottom: spacing.md },
  list: { gap: spacing.sm, paddingBottom: 24 },
  card: {},
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardInfo: { flex: 1 },
  cardTitle: { ...typography.cardTitle, color: colors.textPrimary },
  cardDate: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  fileHint: { ...typography.caption, color: colors.navy, marginTop: 4 },
  fileRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  pickBtn: { flex: 1, backgroundColor: NAVY, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  pickBtnPdf: { backgroundColor: colors.gold || '#d4a843' },
  pickBtnText: { ...typography.buttonSmall, color: '#fff' },
  fileList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  fileChip: { backgroundColor: colors.cream, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.border },
  fileName: { ...typography.caption, color: colors.textPrimary, maxWidth: 120 },
});
