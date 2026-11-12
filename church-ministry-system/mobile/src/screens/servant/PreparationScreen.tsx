import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
// Lazy load expo-document-picker so older native builds without the newly installed module don't crash the entire app on launch
const getDocumentPicker = (): typeof import('expo-document-picker') | null => {
  try {
    return require('expo-document-picker');
  } catch (err) {
    console.warn('[PreparationScreen] expo-document-picker is not available in current native build:', err);
    return null;
  }
};
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useLocale } from '../../hooks/useLocale';
import AppHeader from '../../components/AppHeader';
import { AppInput, AppButton, AppCard, AppBadge, AppEmptyState } from '../../components/ui';
import { preparationsApi } from '../../api/preparations.api';
import apiClient from '../../api/client';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

const NAVY = '#192f5f';
const GOLD = '#d4a843';
const CREAM = 'rgb(247, 244, 237)';
const OFF_WHITE = '#fcfbf8';
const BORDER = '#eceae4';
const CHARCOAL = '#1c1c1c';
const MUTED = '#5f5f5d';

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  draft: { label: 'مسودة', variant: 'neutral' },
  submitted: { label: 'مقدّم', variant: 'info' },
  under_review: { label: 'قيد المراجعة', variant: 'warning' },
  approved: { label: 'معتمد', variant: 'success' },
  rejected: { label: 'مرفوض', variant: 'error' },
};

export default function PreparationScreen() {
  const { t } = useLocale();
  const user = useSelector((state: RootState) => state.auth.user);
  const activeContext = useSelector((state: RootState) => state.auth.activeContext);
  const memberId = useSelector((state: RootState) => (state.auth as any).memberId);

  const [preparations, setPreparations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPrepId, setUploadingPrepId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'my' | 'all' | 'draft' | 'submitted' | 'approved' | 'rejected'>('my');

  // New Preparation Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);
  const [keyPointInput, setKeyPointInput] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [verseInput, setVerseInput] = useState('');
  const [bibleVerses, setBibleVerses] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await preparationsApi.getAll();
      setPreparations(res?.data || res || []);
    } catch {
      setPreparations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const resetModal = () => {
    setTitle('');
    setLessonDate(new Date().toISOString().split('T')[0]);
    setKeyPointInput('');
    setKeyPoints([]);
    setVerseInput('');
    setBibleVerses([]);
    setNotes('');
    setModalVisible(false);
  };

  const handleAddKeyPoint = () => {
    if (!keyPointInput.trim()) return;
    setKeyPoints((prev) => [...prev, keyPointInput.trim()]);
    setKeyPointInput('');
  };

  const handleRemoveKeyPoint = (idx: number) => {
    setKeyPoints((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddVerse = () => {
    if (!verseInput.trim()) return;
    setBibleVerses((prev) => [...prev, verseInput.trim()]);
    setVerseInput('');
  };

  const handleRemoveVerse = (idx: number) => {
    setBibleVerses((prev) => prev.filter((_, i) => i !== idx));
  };

  const createPreparation = async () => {
    if (!title.trim()) {
      Alert.alert('', t('preparation.titlePlaceholder') || 'يرجى إدخال عنوان الدرس');
      return;
    }
    setCreating(true);
    try {
      const description = JSON.stringify({
        keyPoints: keyPoints.length > 0 ? keyPoints : [title.trim()],
        bibleVerses,
        text: notes.trim(),
      });
      await preparationsApi.create({
        title: title.trim(),
        lessonDate,
        description,
        status: 'draft',
      });
      Alert.alert('', t('preparation.created') || 'تم إنشاء التحضير بنجاح');
      resetModal();
      await loadData();
    } catch (err: any) {
      Alert.alert('', err?.message || t('app.error'));
    } finally {
      setCreating(false);
    }
  };

  const pickAndUpload = async (prepId: string) => {
    try {
      const picker = getDocumentPicker();
      if (!picker || typeof picker.getDocumentAsync !== 'function') {
        Alert.alert(
          'تنبيه',
          'ميزة اختيار الملفات تتطلب إعادة بناء التطبيق لتحديث الحزم الأصلية على هاتفك. يُرجى تشغيل:\nnpx expo run:android'
        );
        return;
      }

      const res = await picker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/*',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const asset = res.assets[0];
      setUploadingPrepId(prepId);
      await preparationsApi.uploadFile(prepId, asset.uri, asset.name, asset.mimeType);
      Alert.alert('', t('preparation.uploadSuccess') || 'تم رفع الملف بنجاح');
      await loadData();
    } catch (err: any) {
      Alert.alert('', err?.message || 'فشل رفع الملف');
    } finally {
      setUploadingPrepId(null);
    }
  };

  const deleteFile = async (prepId: string, fileId: string) => {
    Alert.alert(
      t('preparation.delete') || 'حذف المرفق',
      t('preparation.deleteFileConfirm') || 'هل أنت متأكد من حذف هذا الملف؟',
      [
        { text: t('preparation.cancel') || 'إلغاء', style: 'cancel' },
        {
          text: t('preparation.delete') || 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await preparationsApi.deleteFile(prepId, fileId);
              await loadData();
            } catch (err: any) {
              Alert.alert('', err?.message || 'فشل حذف الملف');
            }
          },
        },
      ]
    );
  };

  const openFile = async (file: any) => {
    try {
      const filePath = file.fileUrl || file.file_url || '';
      if (!filePath) return;
      let url = filePath;
      if (!filePath.startsWith('http')) {
        const apiBase = (apiClient.defaults.baseURL as string) || 'http://localhost:3000/api/v1';
        const hostBase = apiBase.replace(/\/api\/v1\/?$/, '');
        url = `${hostBase}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
      }
      await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert('', err?.message || t('app.error'));
    }
  };

  const submitPreparation = async (prepId: string) => {
    Alert.alert(
      t('preparation.submit') || 'تقديم التحضير',
      t('preparation.submitConfirm') || 'هل تريد تقديم هذا التحضير لمراجعته من قبل أمين الخدمة؟',
      [
        { text: t('preparation.cancel') || 'إلغاء', style: 'cancel' },
        {
          text: t('preparation.submit') || 'تقديم',
          onPress: async () => {
            try {
              await preparationsApi.submit(prepId);
              Alert.alert('', t('preparation.submittedSuccess') || 'تم تقديم التحضير للمراجعة بنجاح');
              await loadData();
            } catch (err: any) {
              Alert.alert('', err?.message || 'فشل تقديم التحضير');
            }
          },
        },
      ]
    );
  };

  const deletePreparation = async (prepId: string) => {
    Alert.alert(
      t('preparation.delete') || 'حذف التحضير',
      t('preparation.deleteConfirm') || 'هل أنت متأكد من حذف هذا التحضير؟',
      [
        { text: t('preparation.cancel') || 'إلغاء', style: 'cancel' },
        {
          text: t('preparation.delete') || 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await preparationsApi.deletePrep(prepId);
              await loadData();
            } catch (err: any) {
              Alert.alert('', err?.message || 'فشل حذف التحضير');
            }
          },
        },
      ]
    );
  };

  const parseDescription = (raw: string | null | undefined) => {
    if (!raw || typeof raw !== 'string') return { text: '', keyPoints: [], bibleVerses: [] };
    const trimmed = raw.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return { text: trimmed, keyPoints: [], bibleVerses: [] };
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj === 'object') {
        const kp = Array.isArray(obj.keyPoints) ? obj.keyPoints.filter(Boolean) : [];
        const bv = Array.isArray(obj.bibleVerses) ? obj.bibleVerses.filter(Boolean) : [];
        const extra = typeof obj.text === 'string' ? obj.text : '';
        return { text: extra, keyPoints: kp, bibleVerses: bv };
      }
    } catch { }
    return { text: trimmed, keyPoints: [], bibleVerses: [] };
  };

  const filteredPreparations = preparations.filter((p) => {
    if (selectedFilter === 'my') {
      const pServantId = p.servantId || p.servant_id || p.servant?.id;
      const myId = memberId || user?.id;
      return Number(pServantId) === Number(myId);
    }
    if (selectedFilter === 'all') return true;
    return p.status === selectedFilter;
  });

  const renderPrep = ({ item }: { item: any }) => {
    const files = item.files || [];
    const statusConfig = STATUS_MAP[item.status] || { label: item.status, variant: 'neutral' as const };
    const parsedDesc = parseDescription(item.description);
    const canSubmit = item.status === 'draft' || item.status === 'rejected';
    const canDelete = item.status === 'draft';
    const isUploadingThis = uploadingPrepId === String(item.id);

    return (
      <AppCard variant="bordered" style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDate}>{item.lessonDate}</Text>
          </View>
          <AppBadge label={statusConfig.label} variant={statusConfig.variant} />
        </View>

        {/* Rejection / Review Notes Banner */}
        {item.reviewNotes ? (
          <View style={styles.reviewNotesBox}>
            <Text style={styles.reviewNotesTitle}>{t('preparation.reviewerNotes') || 'ملاحظات المراجع:'}</Text>
            <Text style={styles.reviewNotesText}>{item.reviewNotes}</Text>
          </View>
        ) : null}

        {/* Key Points */}
        {parsedDesc.keyPoints.length > 0 && (
          <View style={styles.pointsWrap}>
            {parsedDesc.keyPoints.map((kp: string, idx: number) => (
              <Text key={idx} style={styles.pointLine} numberOfLines={2}>
                • {kp}
              </Text>
            ))}
          </View>
        )}

        {/* Bible Verses */}
        {parsedDesc.bibleVerses.length > 0 && (
          <View style={styles.versesRow}>
            {parsedDesc.bibleVerses.map((v: string, idx: number) => (
              <AppBadge key={idx} label={v} variant="info" style={styles.verseBadge} />
            ))}
          </View>
        )}

        {/* Attached Files Section */}
        {files.length > 0 && (
          <View style={styles.fileSection}>
            <Text style={styles.fileSectionTitle}>
              {t('preparation.files') || 'المرفقات'} ({files.length})
            </Text>
            {files.map((f: any) => {
              const fType = f.fileType || f.file_type || '';
              const fName = f.fileName || f.file_name || 'file';
              const fSize = f.fileSizeBytes || f.file_size_bytes || 0;
              const icon = fType === 'image' ? '🖼' : fType === 'presentation' ? '📊' : '📄';

              return (
                <View key={f.id} style={styles.fileItem}>
                  <Text style={styles.fileIcon}>{icon}</Text>
                  <TouchableOpacity
                    style={styles.fileNameTouch}
                    onPress={() => openFile(f)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.fileNameText} numberOfLines={1}>
                      {fName}
                    </Text>
                    {fSize > 0 && (
                      <Text style={styles.fileSizeText}>
                        {(fSize / 1024).toFixed(0)} KB
                      </Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.fileActions}>
                    <TouchableOpacity
                      style={styles.fileDownloadBtn}
                      onPress={() => openFile(f)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.fileDownloadText}>{t('preparation.download') || 'عرض'}</Text>
                    </TouchableOpacity>

                    {canSubmit && (
                      <TouchableOpacity
                        style={styles.fileDeleteBtn}
                        onPress={() => deleteFile(String(item.id), String(f.id))}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.fileDeleteText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Card Actions */}
        <View style={styles.cardActionsRow}>
          {/* Attach Document / Image */}
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => pickAndUpload(String(item.id))}
            activeOpacity={0.7}
            disabled={isUploadingThis}
          >
            {isUploadingThis ? (
              <ActivityIndicator size="small" color={NAVY} />
            ) : (
              <Text style={styles.attachBtnText}>+ {t('preparation.attachFile') || 'إرفاق ملف أو صورة'}</Text>
            )}
          </TouchableOpacity>

          {/* Submit Button */}
          {canSubmit && (
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => submitPreparation(String(item.id))}
              activeOpacity={0.7}
            >
              <Text style={styles.submitBtnText}>{t('preparation.submit') || 'تقديم للمراجعة'}</Text>
            </TouchableOpacity>
          )}

          {/* Delete Draft Button */}
          {canDelete && (
            <TouchableOpacity
              style={styles.deletePrepBtn}
              onPress={() => deletePreparation(String(item.id))}
              activeOpacity={0.7}
            >
              <Text style={styles.deletePrepText}>🗑</Text>
            </TouchableOpacity>
          )}
        </View>
      </AppCard>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top App Header matching Dashboard and Attendance */}
      <AppHeader greetingText={t('preparation.heading') || 'تحضير الدروس'}>
        <View style={styles.classInfoCard}>
          <View style={styles.classInfoRow}>
            <View style={styles.classInfoIconWrap}>
              <Text style={styles.classInfoIcon}>{"\uD83D\uDCD6"}</Text>
            </View>
            <View style={styles.classInfoTextWrap}>
              <Text style={styles.classInfoTitle}>
                {activeContext?.displayLabel || 'خدمة مدارس الأحد'}
              </Text>
              <Text style={styles.classInfoMeta}>
                {t('preparation.heading') || 'تحضير ومتابعة الدروس الأسبوعية'}
              </Text>
            </View>
          </View>
        </View>
      </AppHeader>

      <View style={styles.contentWrap}>
        {/* Action Card: New Preparation */}
        <TouchableOpacity
          style={styles.createCard}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.createCardLeft}>
            <View style={styles.createCardIconWrap}>
              <Text style={styles.createCardIcon}>{"\u2795"}</Text>
            </View>
            <View>
              <Text style={styles.createCardTitle}>
                {t('preparation.newPreparation') || 'تحضير درس جديد'}
              </Text>
              <Text style={styles.createCardSubtitle}>
                {activeContext?.displayLabel || 'إنشاء مسودة درس وإرفاق الملفات'}
              </Text>
            </View>
          </View>
          <Text style={styles.createCardArrow}>{"\u276E"}</Text>
        </TouchableOpacity>

        {/* Filter Chips */}
        <View style={styles.filterScroll}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {(['my', 'all', 'draft', 'submitted', 'approved', 'rejected'] as const).map((filterKey) => {
              const isSelected = selectedFilter === filterKey;
              const labels: Record<string, string> = {
                my: 'تحضيراتي',
                all: t('preparation.filterAll') || 'الكل',
                draft: t('preparation.filterDraft') || 'مسودات',
                submitted: t('preparation.filterSubmitted') || 'مقدّمة',
                approved: t('preparation.filterApproved') || 'معتمدة',
                rejected: t('preparation.filterRejected') || 'مرفوضة',
              };
              return (
                <TouchableOpacity
                  key={filterKey}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(filterKey)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {labels[filterKey]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={NAVY} />
          </View>
        ) : (
          <FlatList
            data={filteredPreparations}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderPrep}
            contentContainerStyle={styles.list}
            refreshing={refreshing}
            onRefresh={onRefresh}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <AppEmptyState
                icon="file-text"
                title={selectedFilter === 'my' ? 'لا توجد تحضيرات خاصة بك بعد' : (t('preparation.noPreparations') || 'لا توجد تحضيرات')}
                description={selectedFilter === 'my' ? 'اضغط على "+ تحضير درس جديد" للبدء أو اختر "الكل" لعرض جميع التحضيرات.' : undefined}
              />
            }
          />
        )}
      </View>

      {/* Create Preparation Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={resetModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('preparation.newPreparation') || 'تحضير درس جديد'}</Text>
              <TouchableOpacity onPress={resetModal} activeOpacity={0.7}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Title Input */}
              <Text style={styles.fieldLabel}>{t('preparation.titlePlaceholder') || 'عنوان الدرس'}</Text>
              <AppInput
                placeholder={t('preparation.titlePlaceholder') || 'عنوان الدرس'}
                value={title}
                onChangeText={setTitle}
                textAlign="right"
              />

              {/* Lesson Date */}
              <Text style={styles.fieldLabel}>تاريخ الدرس (YYYY-MM-DD)</Text>
              <AppInput
                placeholder="2026-11-20"
                value={lessonDate}
                onChangeText={setLessonDate}
                textAlign="right"
              />

              {/* Key Points */}
              <Text style={styles.fieldLabel}>{t('preparation.keyPoints') || 'النقاط الرئيسية'}</Text>
              <View style={styles.inlineAddRow}>
                <TextInput
                  style={styles.inlineInput}
                  placeholder="أضف نقطة رئيسية..."
                  placeholderTextColor={MUTED}
                  value={keyPointInput}
                  onChangeText={setKeyPointInput}
                  textAlign="right"
                />
                <TouchableOpacity style={styles.inlineAddBtn} onPress={handleAddKeyPoint} activeOpacity={0.7}>
                  <Text style={styles.inlineAddBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              {keyPoints.map((kp, idx) => (
                <View key={idx} style={styles.tagItem}>
                  <Text style={styles.tagText} numberOfLines={1}>• {kp}</Text>
                  <TouchableOpacity onPress={() => handleRemoveKeyPoint(idx)}>
                    <Text style={styles.tagRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Bible Verses */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.sm }]}>
                {t('preparation.bibleVerses') || 'الشواهد والآيات'}
              </Text>
              <View style={styles.inlineAddRow}>
                <TextInput
                  style={styles.inlineInput}
                  placeholder="مثال: يوحنا 3:16"
                  placeholderTextColor={MUTED}
                  value={verseInput}
                  onChangeText={setVerseInput}
                  textAlign="right"
                />
                <TouchableOpacity style={styles.inlineAddBtn} onPress={handleAddVerse} activeOpacity={0.7}>
                  <Text style={styles.inlineAddBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tagContainer}>
                {bibleVerses.map((v, idx) => (
                  <View key={idx} style={styles.verseChip}>
                    <Text style={styles.verseChipText}>{v}</Text>
                    <TouchableOpacity onPress={() => handleRemoveVerse(idx)}>
                      <Text style={styles.verseChipRemove}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Notes */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.sm }]}>ملاحظات ومحتوى إضافي</Text>
              <TextInput
                style={styles.textArea}
                placeholder="أضف ملاحظات أو شرحاً إضافياً للدرس..."
                placeholderTextColor={MUTED}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlign="right"
              />

              <View style={styles.modalActions}>
                <AppButton
                  title={t('preparation.save') || 'حفظ كمسودة'}
                  onPress={createPreparation}
                  loading={creating}
                  variant="primary"
                  style={{ flex: 1 }}
                />
                <AppButton
                  title={t('preparation.cancel') || 'إلغاء'}
                  onPress={resetModal}
                  variant="secondary"
                  style={{ marginStart: spacing.sm }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  classInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  classInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classInfoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  classInfoIcon: { fontSize: 16 },
  classInfoTextWrap: { flex: 1 },
  classInfoTitle: {
    fontSize: 13,
    lineHeight: 17,
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'right',
  },
  classInfoMeta: {
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
    textAlign: 'right',
  },

  contentWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 14,
    ...shadows.card,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  createCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createCardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCardIcon: { fontSize: 18, color: CHARCOAL },
  createCardTitle: {
    ...typography.cardTitle,
    color: CHARCOAL,
    fontWeight: '700',
    textAlign: 'right',
  },
  createCardSubtitle: {
    ...typography.caption,
    color: MUTED,
    marginTop: 2,
    textAlign: 'right',
  },
  createCardArrow: { fontSize: 16, color: MUTED },

  filterScroll: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: OFF_WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterChipActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  filterChipText: {
    ...typography.caption,
    color: MUTED,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  list: {
    gap: 10,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: OFF_WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    ...shadows.card,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitleWrap: {
    flex: 1,
    marginEnd: 8,
  },
  cardTitle: {
    ...typography.cardTitle,
    color: CHARCOAL,
    fontWeight: '700',
    textAlign: 'right',
  },
  cardDate: {
    ...typography.caption,
    color: MUTED,
    marginTop: 2,
    textAlign: 'right',
  },
  reviewNotesBox: {
    backgroundColor: '#fff8e1',
    borderRightWidth: 4,
    borderRightColor: GOLD,
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  reviewNotesTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: '#8c6b12',
    marginBottom: 2,
    textAlign: 'right',
  },
  reviewNotesText: {
    ...typography.caption,
    color: CHARCOAL,
    textAlign: 'right',
  },
  pointsWrap: {
    marginTop: 6,
    gap: 2,
  },
  pointLine: {
    ...typography.caption,
    color: CHARCOAL,
    textAlign: 'right',
  },
  versesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  verseBadge: {
    backgroundColor: 'rgba(25, 47, 95, 0.08)',
  },
  fileSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  fileSectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: CHARCOAL,
    marginBottom: 6,
    textAlign: 'right',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  fileIcon: {
    fontSize: 18,
    marginEnd: 8,
  },
  fileNameTouch: {
    flex: 1,
  },
  fileNameText: {
    ...typography.caption,
    fontWeight: '600',
    color: CHARCOAL,
    textAlign: 'right',
  },
  fileSizeText: {
    fontSize: 10,
    color: MUTED,
    textAlign: 'right',
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fileDownloadBtn: {
    backgroundColor: 'rgba(25, 47, 95, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(25, 47, 95, 0.15)',
  },
  fileDownloadText: {
    ...typography.caption,
    color: NAVY,
    fontWeight: '700',
  },
  fileDeleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDeleteText: {
    color: '#c62828',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  attachBtn: {
    flex: 1,
    backgroundColor: 'rgba(212, 168, 67, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 67, 0.35)',
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachBtnText: {
    ...typography.buttonSmall,
    color: '#9e7310',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    ...typography.buttonSmall,
    color: '#ffffff',
    fontWeight: '700',
  },
  deletePrepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(198, 40, 40, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePrepText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: OFF_WHITE,
    borderRadius: 20,
    maxHeight: '90%',
    overflow: 'hidden',
    ...shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    ...typography.cardTitle,
    color: CHARCOAL,
    fontWeight: '700',
  },
  modalClose: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: 'bold',
    padding: 4,
  },
  modalBody: {
    padding: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
    marginTop: spacing.xs,
  },
  inlineAddRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  inlineInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  inlineAddBtn: {
    width: 40,
    height: 40,
    backgroundColor: NAVY,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineAddBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  tagText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
  },
  tagRemove: {
    color: colors.error,
    fontWeight: 'bold',
    marginStart: spacing.xs,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.xs,
  },
  verseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal40,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  verseChipText: {
    ...typography.overline,
    color: colors.offWhite,
  },
  verseChipRemove: {
    color: colors.offWhite,
    fontWeight: 'bold',
    marginStart: 6,
    fontSize: 10,
  },
  textArea: {
    minHeight: 80,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
});
