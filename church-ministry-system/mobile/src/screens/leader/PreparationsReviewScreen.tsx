import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Alert, Linking,
} from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { useActiveContext } from '../../hooks/useActiveContext';
import { preparationsApi } from '../../api/preparations.api';
import { AppCard, AppBadge, AppButton, AppEmptyState } from '../../components/ui';
import { colors, typography, shadows } from '../../theme';

const NAVY = colors.navy;
const GOLD = colors.gold;
const CREAM = colors.cream;
const OFF_WHITE = colors.offWhite;
const MUTED = colors.mutedGray;
const GREEN = '#2e7d32';
const RED = '#c62828';

const STATUS_VARIANTS: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; labelKey: string }> = {
  draft: { variant: 'neutral', labelKey: 'draft' },
  submitted: { variant: 'info', labelKey: 'submitted' },
  under_review: { variant: 'warning', labelKey: 'underReview' },
  approved: { variant: 'success', labelKey: 'approved' },
  rejected: { variant: 'error', labelKey: 'rejected' },
};

export default function PreparationsReviewScreen() {
  const { t } = useLocale();
  const { serviceId } = useActiveContext();
  const [preparations, setPreparations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPrep, setSelectedPrep] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!serviceId) return;
    setLoading(true);
    try {
      const res = await preparationsApi.getAll({ serviceId });
      setPreparations(res?.data || []);
    } catch {
      setPreparations([]);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

  const loadComments = useCallback(async (prepId: string) => {
    try {
      const res = await preparationsApi.getComments(prepId);
      setComments(res?.data || []);
    } catch {
      setComments([]);
    }
  }, []);

  const openReview = async (prep: any) => {
    setSelectedPrep(prep);
    setReviewNotes(prep.reviewNotes || '');
    setCommentText('');
    await loadComments(String(prep.id));
  };

  const closeReview = () => {
    setSelectedPrep(null);
    setReviewNotes('');
    setComments([]);
    setCommentText('');
  };

  const handleReview = async (status: string) => {
    if (!selectedPrep) return;
    setSaving(true);
    try {
      await preparationsApi.review(String(selectedPrep.id), { status, reviewNotes });
      Alert.alert('', t('preparationReview.reviewSuccess'));
      closeReview();
      loadData();
    } catch (err: any) {
      Alert.alert('', err?.message || t('app.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedPrep || !commentText.trim()) return;
    try {
      await preparationsApi.addComment(String(selectedPrep.id), commentText.trim());
      setCommentText('');
      loadComments(String(selectedPrep.id));
    } catch {
      Alert.alert('', t('app.error'));
    }
  };

  const handleDownload = async (file: any) => {
    try {
      const base = 'http://10.134.143.23:3000';
      const url = file.file_url?.startsWith('http') ? file.file_url : `${base}${file.file_url}`;
      await Linking.openURL(url);
    } catch (err: any) { Alert.alert('', err?.message || t('app.error')); }
  };

  const statusKey = (s: string) => {
    switch (s) {
      case 'draft': return 'مسودة';
      case 'submitted': return 'مقدّم';
      case 'under_review': return 'قيد المراجعة';
      case 'approved': return 'مقبول';
      case 'rejected': return 'مرفوض';
      default: return s;
    }
  };

  const parseDescription = (raw: string | null | undefined) => {
    if (!raw || typeof raw !== 'string') return { text: '', keyPoints: [], bibleVerses: [], extra: '' };
    const trimmed = raw.trim();
    if (!trimmed) return { text: '', keyPoints: [], bibleVerses: [], extra: '' };
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return { text: trimmed, keyPoints: [], bibleVerses: [], extra: '' };
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj === 'object') {
        const kp = Array.isArray((obj as any).keyPoints) ? (obj as any).keyPoints.filter(Boolean).map(String) : [];
        const bv = Array.isArray((obj as any).bibleVerses) ? (obj as any).bibleVerses.filter(Boolean).map(String) : [];
        const extra = typeof (obj as any).content === 'string' ? (obj as any).content : typeof (obj as any).text === 'string' ? (obj as any).text : '';
        if (kp.length || bv.length || extra) return { text: '', keyPoints: kp, bibleVerses: bv, extra };
      }
    } catch {}
    return { text: trimmed, keyPoints: [], bibleVerses: [], extra: '' };
  };

  const renderPrep = ({ item }: { item: any }) => {
    const sv = STATUS_VARIANTS[item.status] || { variant: 'neutral' as const };
    const name = item.servant?.user?.fullName || t('preparationReview.noServant');
    const preview = parseDescription(item.description);
    return (
      <TouchableOpacity onPress={() => openReview(item)} activeOpacity={0.7}>
        <AppCard variant="bordered" style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{"\u2711"}</Text>
            </View>
            <View style={styles.titleWrap}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <View style={styles.cardBody}>
                <Text style={styles.meta} numberOfLines={1}>{t('preparationReview.servant')}{name}</Text>
                <Text style={styles.meta}>{t('preparationReview.lessonDate')}{item.lessonDate}</Text>
                {preview.keyPoints.length > 0 && <Text style={styles.previewLine} numberOfLines={1}>• {preview.keyPoints[0]}</Text>}
              </View>
            </View>
            <AppBadge label={statusKey(item.status)} variant={sv.variant} style={styles.statusBadge} />
          </View>
        </AppCard>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading} >{t('preparationReview.title')}</Text>
      </View>
      <View style={styles.waveContainer} />
      <FlatList
        data={preparations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPrep}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <AppEmptyState
            icon="check-circle"
            title={t('preparationReview.empty')}
          />
        }
      />

      <Modal
        visible={!!selectedPrep}
        transparent
        animationType="slide"
        onRequestClose={closeReview}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            {selectedPrep && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={2}>
                    {selectedPrep.title}
                  </Text>
                  <TouchableOpacity onPress={closeReview} activeOpacity={0.7}>
                    <Text style={styles.modalClose}>{'\u2715'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('preparationReview.servant')}</Text>
                  <Text style={styles.detailValue}>
                    {selectedPrep.servant?.user?.fullName || t('preparationReview.noServant')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('preparationReview.lessonDate')}</Text>
                  <Text style={styles.detailValue}>{selectedPrep.lessonDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('preparationReview.status')}</Text>
                  <AppBadge
                    label={statusKey(selectedPrep.status)}
                    variant={(STATUS_VARIANTS[selectedPrep.status]?.variant) || 'neutral'}
                  />
                </View>

                {(() => {
                  const parsed = parseDescription(selectedPrep.description);
                  const hasRich = parsed.keyPoints.length > 0 || parsed.bibleVerses.length > 0;
                  return (
                    <>
                      {hasRich ? (
                        <>
                          {parsed.keyPoints.length > 0 && (
                            <View style={styles.contentCard}>
                              <Text style={styles.contentLabel}>{t('preparation.keyPoints') || 'النقاط الرئيسية'}</Text>
                              {parsed.keyPoints.map((kp: string, idx: number) => (
                                <View key={idx} style={styles.bulletRow}>
                                  <View style={styles.bulletDot} />
                                  <Text style={styles.bulletText}>{kp}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                          {parsed.bibleVerses.length > 0 && (
                            <View style={styles.contentCard}>
                              <Text style={styles.contentLabel}>{t('preparation.bibleVerses') || 'الآيات'}</Text>
                              <View style={styles.verseRow}>
                                {parsed.bibleVerses.map((v: string, idx: number) => (
                                  <AppBadge key={idx} label={v} variant="info" style={styles.verseBadge} />
                                ))}
                              </View>
                            </View>
                          )}
                          {parsed.extra ? (
                            <View style={styles.descriptionBox}>
                              <Text style={styles.descriptionText}>{parsed.extra}</Text>
                            </View>
                          ) : null}
                        </>
                      ) : parsed.text ? (
                        <View style={styles.descriptionBox}>
                          <Text style={styles.descriptionText}>{parsed.text}</Text>
                        </View>
                      ) : null}
                    </>
                  );
                })()}

                {selectedPrep.files && selectedPrep.files.length > 0 && (
                  <View style={[styles.contentCard, { marginTop: 12 }]}>
                    <Text style={styles.contentLabel}>{t('preparation.files') || 'المرفقات'}</Text>
                    {selectedPrep.files.map((f: any) => (
                      <View key={f.id} style={styles.fileRow}>
                        <View style={styles.fileIconWrap}>
                          <Text style={styles.fileIcon}>{f.file_type === 'image' ? '🖼' : f.file_type === 'presentation' ? '📊' : '📄'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fileName} numberOfLines={1}>{f.file_name}</Text>
                          <Text style={styles.fileMeta}>{f.file_type} {f.file_size_bytes ? `• ${(f.file_size_bytes/1024).toFixed(0)}KB` : ''}</Text>
                        </View>
                        <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(f)} activeOpacity={0.7}>
                          <Text style={styles.downloadText}>{t('preparation.download') || 'تحميل'}</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('preparationReview.reviewNotes')}</Text>
                </View>
                <TextInput
                  style={styles.reviewInput}
                  value={reviewNotes}
                  onChangeText={setReviewNotes}
                  placeholder={t('preparationReview.reviewNotesPlaceholder')}
                  placeholderTextColor={MUTED}
                  multiline
                  textAlignVertical="top"
                />

                {selectedPrep.status === 'submitted' && (
                  <View style={styles.reviewActions}>
                    <AppButton
                      title={t('preparationReview.approve')}
                      onPress={() => handleReview('approved')}
                      variant="success"
                      loading={saving}
                      style={styles.actionBtn}
                    />
                    <View style={{ width: 12 }} />
                    <AppButton
                      title={t('preparationReview.reject')}
                      onPress={() => handleReview('rejected')}
                      variant="danger"
                      loading={saving}
                      style={styles.actionBtn}
                    />
                  </View>
                )}

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('preparationReview.comments')}</Text>
                </View>

                {comments.length === 0 ? (
                  <Text style={styles.emptyComments}>{t('app.noData')}</Text>
                ) : (
                  comments.map((c: any) => (
                    <View key={c.id} style={styles.commentBubble}>
                      <Text style={styles.commentAuthor}>
                        {c.author?.fullName || t('app.unknown')}
                      </Text>
                      <Text style={styles.commentBody}>{c.body}</Text>
                    </View>
                  ))
                )}

                <View style={styles.commentInputRow}>
                  <TextInput
                    style={styles.commentInput}
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder={t('preparationReview.commentPlaceholder')}
                    placeholderTextColor={MUTED}
                    multiline
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
                    onPress={handleAddComment}
                    disabled={!commentText.trim()}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sendBtnText}>{t('preparationReview.addComment')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, alignItems: 'center', justifyContent: 'center' },
  heading: { ...typography.subHeading, color: '#ffffff', textAlign: 'center' , width: '100%' ,height: 30, lineHeight: 30, fontSize: 20, fontWeight: '700' },
  waveContainer: { height: 30, backgroundColor: NAVY, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 0 },
  list: { gap: 12, padding: 16, paddingBottom: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 16, color: '#ffffff' },
  titleWrap: { flex: 1 },
  title: { ...typography.cardTitle, color: NAVY, marginBottom: 2 },
  cardBody: { gap: 2 },
  meta: { ...typography.caption, color: MUTED, textAlign: 'left' },
  previewLine: { ...typography.caption, color: MUTED, textAlign: 'left', marginTop: 2 },
  statusBadge: { marginStart: 8 },
  reviewHint: { display: 'none' },
  reviewHintText: { ...typography.caption, color: MUTED },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CREAM },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalScroll: { flex: 1 },
  modalContent: { backgroundColor: OFF_WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { ...typography.subHeading, color: NAVY, flex: 1, marginRight: 16 },
  modalClose: { fontSize: 22, color: MUTED },

  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailLabel: { ...typography.body, color: MUTED },
  detailValue: { ...typography.body, color: NAVY, flex: 1, textAlign: 'left' },

  descriptionBox: { backgroundColor: CREAM, borderRadius: 12, padding: 12, marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  descriptionText: { ...typography.body, color: NAVY, textAlign: 'left' },
  contentCard: { backgroundColor: CREAM, borderRadius: 12, padding: 12, marginTop: 8, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  contentLabel: { ...typography.cardTitle, color: NAVY, fontSize: 13, marginBottom: 8, textAlign: 'left' },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: NAVY },
  bulletText: { ...typography.body, color: NAVY, flex: 1, textAlign: 'left' },
  verseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  verseBadge: {},

  sectionHeader: { marginTop: 20, marginBottom: 8 },
  sectionTitle: { ...typography.cardTitle, color: NAVY },

  reviewInput: { backgroundColor: CREAM, borderRadius: 12, padding: 12, minHeight: 80, ...typography.body, color: NAVY, textAlignVertical: 'top' },

  reviewActions: { flexDirection: 'row', marginTop: 16 },
  actionBtn: { flex: 1 },

  emptyComments: { ...typography.body, color: MUTED, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },

  commentBubble: { backgroundColor: CREAM, borderRadius: 12, padding: 12, marginBottom: 8 },
  commentAuthor: { ...typography.buttonSmall, color: NAVY, marginBottom: 4 },
  commentBody: { ...typography.body, color: NAVY },

  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 12, gap: 8 },
  commentInput: { flex: 1, backgroundColor: CREAM, borderRadius: 12, padding: 12, minHeight: 44, maxHeight: 100, ...typography.body, color: NAVY },
  sendBtn: { backgroundColor: NAVY, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { ...typography.button, color: '#ffffff' },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffffff', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  fileIconWrap: { width: 36, height: 36, borderRadius: 8, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  fileIcon: { fontSize: 14, color: '#ffffff' },
  fileName: { ...typography.body, color: NAVY, fontSize: 13, flex: 1 },
  fileMeta: { ...typography.caption, color: MUTED, fontSize: 11 },
  downloadBtn: { backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  downloadText: { ...typography.buttonSmall, color: '#ffffff', fontWeight: '700' },
});
