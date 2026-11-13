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
import CalendarPicker from '../../components/CalendarPicker';
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Array<{ uri: string; name: string; mimeType?: string; size?: number }>>([]);

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
    setNotes('');
    setSelectedFiles([]);
    setShowDatePicker(false);
    setModalVisible(false);
  };

  const pickNewPrepFile = async () => {
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
        multiple: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const newFiles = res.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
      }));

      setSelectedFiles((prev) => [...prev, ...newFiles]);
    } catch (err: any) {
      Alert.alert('', err?.message || 'فشل اختيار الملف');
    }
  };

  const removeSelectedFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const createPreparation = async () => {
    if (!title.trim()) {
      Alert.alert('', t('preparation.titlePlaceholder') || 'يرجى إدخال عنوان الدرس');
      return;
    }
    setCreating(true);
    try {
      const createdRes: any = await preparationsApi.create({
        title: title.trim(),
        lessonDate,
        description: notes.trim(),
        status: 'draft',
      });
      const newPrep = createdRes?.data || createdRes;
      const newPrepId = String(newPrep?.id);

      // Upload any files attached during creation
      if (selectedFiles.length > 0 && newPrepId) {
        for (const f of selectedFiles) {
          try {
            await preparationsApi.uploadFile(newPrepId, f.uri, f.name, f.mimeType);
          } catch (uploadErr) {
            console.warn('[Preparation] Failed uploading attached file:', uploadErr);
          }
        }
      }

      Alert.alert('', t('preparation.created') || 'تم إنشاء التحضير وإرفاق الملفات بنجاح');
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
      t('preparation.submit') || 'تقديم التحضير للمراجعة',
      t('preparation.submitConfirm') || 'هل تريد تقديم هذا التحضير لأمناء الخدمة لمراجعته واعتماده؟',
      [
        { text: t('preparation.cancel') || 'إلغاء', style: 'cancel' },
        {
          text: t('preparation.submit') || 'تقديم',
          onPress: async () => {
            try {
              await preparationsApi.submit(prepId);
              Alert.alert(
                'تم الإرسال بنجاح',
                'تم إرسال التحضير إلى أمناء الخدمة للمراجعة والاعتماد، وتم إرسال إشعار لهم.'
              );
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

  const parseDescription = (raw: string | null | undefined): string => {
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const obj = JSON.parse(trimmed);
        if (obj && typeof obj === 'object') {
          if (typeof obj.text === 'string' && obj.text) return obj.text;
          if (typeof obj.notes === 'string' && obj.notes) return obj.notes;
          if (Array.isArray(obj.keyPoints) && obj.keyPoints.length > 0) return obj.keyPoints.join(' • ');
        }
      } catch { }
    }
    return trimmed;
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
    const notesContent = parseDescription(item.description);
    const isApproved = item.status === 'approved';
    const canModify = !isApproved;
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

        {/* Approved and locked notice banner */}
        {isApproved && (
          <View style={styles.approvedBanner}>
            <Text style={styles.approvedBannerIcon}>✓</Text>
            <Text style={styles.approvedBannerText}>
              تم اعتماد هذا التحضير من قبل أمين الخدمة (مغلق للتعديل)
            </Text>
          </View>
        )}

        {/* Rejection / Review Notes Banner */}
        {item.reviewNotes ? (
          <View style={styles.reviewNotesBox}>
            <Text style={styles.reviewNotesTitle}>{t('preparation.reviewerNotes') || 'ملاحظات المراجع:'}</Text>
            <Text style={styles.reviewNotesText}>{item.reviewNotes}</Text>
          </View>
        ) : null}

        {/* Notes / Content Box */}
        {notesContent ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesBoxTitle}>الملاحظات:</Text>
            <Text style={styles.notesBoxText}>{notesContent}</Text>
          </View>
        ) : null}

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

                    {canModify && canSubmit && (
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
          {/* Attach Document / Image (only when not approved) */}
          {canModify && (
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
          )}

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
            <View style={styles.classInfoTextWrap}>
              <Text style={styles.classInfoTitle}>
                {activeContext?.displayLabel || 'خدمة مدارس الأحد'}
              </Text>
              <Text style={styles.classInfoMeta}>
                {t('preparation.heading') || 'تحضير ومتابعة الدروس الأسبوعية'}
              </Text>
            </View>
            <View style={styles.classInfoIconWrap}>
              <Text style={styles.classInfoIcon}>{"\uD83D\uDCD6"}</Text>
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
              <Text style={styles.fieldLabel}>عنوان وموضوع الدرس</Text>
              <AppInput
                placeholder="مثال: مثل السامري الصالح"
                value={title}
                onChangeText={setTitle}
                textAlign="right"
              />

              {/* Date Input with CalendarPicker */}
              <Text style={styles.fieldLabel}>تاريخ الدرس</Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.datePickerIcon}>📅</Text>
                <Text style={styles.datePickerText}>{lessonDate}</Text>
              </TouchableOpacity>

              {/* Notes Input */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>ملاحظات ومحتوى التحضير</Text>
              <TextInput
                style={styles.textArea}
                placeholder="أضف ملاحظات أو شرحاً للدرس..."
                placeholderTextColor={MUTED}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={5}
                textAlign="right"
              />

              {/* Attach File Section */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.xs }]}>
                إرفاق ملف الدرس (PDF، Word، PowerPoint، صور)
              </Text>
              <TouchableOpacity
                style={styles.modalUploadBtn}
                onPress={pickNewPrepFile}
                activeOpacity={0.7}
              >
                <Text style={styles.modalUploadIcon}>📎</Text>
                <Text style={styles.modalUploadBtnText}>+ اختيار ملف أو صورة للدرس</Text>
              </TouchableOpacity>

              {/* Selected Files List */}
              {selectedFiles.map((f, idx) => (
                <View key={idx} style={styles.selectedFilePill}>
                  <Text style={styles.selectedFileIcon}>
                    {f.name.endsWith('.pdf') ? '📄' : f.name.match(/\.(png|jpg|jpeg|webp)$/i) ? '🖼' : f.name.match(/\.(ppt|pptx)$/i) ? '📊' : '📝'}
                  </Text>
                  <View style={styles.selectedFileInfo}>
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {f.name}
                    </Text>
                    {f.size ? (
                      <Text style={styles.selectedFileSize}>
                        {(f.size / 1024).toFixed(0)} KB
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => removeSelectedFile(idx)}
                    style={styles.selectedFileRemoveBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectedFileRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

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

      {/* Calendar Picker Modal */}
      <CalendarPicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(dateStr) => {
          setLessonDate(dateStr);
          setShowDatePicker(false);
        }}
        initialDate={lessonDate}
      />
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
    justifyContent: 'space-between',
  },
  classInfoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classInfoIcon: { fontSize: 16 },
  classInfoTextWrap: {
    flex: 1,
    marginEnd: 10,
  },
  classInfoTitle: {
    fontSize: 13,
    lineHeight: 17,
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  classInfoMeta: {
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
    textAlign: 'left',
    writingDirection: 'rtl',
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
    textAlign: 'left',
  },
  createCardSubtitle: {
    ...typography.caption,
    color: MUTED,
    marginTop: 2,
    textAlign: 'left',
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
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  cardDate: {
    ...typography.caption,
    color: MUTED,
    marginTop: 2,
    textAlign: 'left',
    writingDirection: 'rtl',
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
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  reviewNotesText: {
    ...typography.caption,
    color: CHARCOAL,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  approvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F5EE',
    borderWidth: 1,
    borderColor: '#a5d6a7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 8,
    gap: 8,
  },
  approvedBannerIcon: {
    color: '#2e7d32',
    fontWeight: 'bold',
    fontSize: 16,
  },
  approvedBannerText: {
    ...typography.caption,
    color: '#2e7d32',
    fontWeight: '700',
    flex: 1,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  notesBox: {
    backgroundColor: 'rgba(28, 28, 28, 0.03)',
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  notesBoxTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: CHARCOAL,
    marginBottom: 4,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  notesBoxText: {
    ...typography.caption,
    color: CHARCOAL,
    textAlign: 'left',
    writingDirection: 'rtl',
    lineHeight: 18,
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
    textAlign: 'left',
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
    textAlign: 'left',
  },
  fileSizeText: {
    fontSize: 10,
    color: MUTED,
    textAlign: 'left',
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
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.xs,
  },
  datePickerIcon: {
    fontSize: 18,
    marginEnd: 10,
  },
  datePickerText: {
    ...typography.body,
    color: CHARCOAL,
    fontWeight: '600',
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
    marginBottom: spacing.xs,
  },
  modalUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 168, 67, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 67, 0.35)',
    borderStyle: 'dashed',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: spacing.xs,
    gap: 8,
  },
  modalUploadIcon: {
    fontSize: 18,
  },
  modalUploadBtnText: {
    ...typography.buttonSmall,
    color: '#9e7310',
    fontWeight: '700',
  },
  selectedFilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    gap: 8,
  },
  selectedFileIcon: {
    fontSize: 18,
  },
  selectedFileInfo: {
    flex: 1,
  },
  selectedFileName: {
    ...typography.caption,
    fontWeight: '600',
    color: CHARCOAL,
    textAlign: 'left',
  },
  selectedFileSize: {
    fontSize: 10,
    color: MUTED,
    textAlign: 'left',
    marginTop: 2,
  },
  selectedFileRemoveBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedFileRemoveText: {
    color: '#c62828',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
});
