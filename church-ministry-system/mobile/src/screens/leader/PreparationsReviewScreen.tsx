import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { useActiveContext } from '../../hooks/useActiveContext';
import { preparationsApi } from '../../api/preparations.api';
import { AppCard, AppBadge, AppButton, AppEmptyState } from '../../components/ui';
import { colors, typography } from '../../theme';

const NAVY = '#192f5f';
const CREAM = '#f7f4ed';
const OFF_WHITE = '#fcfbf8';
const MUTED = '#5f5f5d';
const GREEN = '#2e7d32';
const RED = '#c62828';
const YELLOW = '#e6a817';

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

  const renderPrep = ({ item }: { item: any }) => {
    const sv = STATUS_VARIANTS[item.status] || { variant: 'neutral' as const };
    const name = item.servant?.user?.fullName || t('preparationReview.noServant');
    const canReview = item.status === 'submitted';
    return (
      <TouchableOpacity onPress={() => openReview(item)} activeOpacity={0.7}>
        <AppCard variant="bordered" style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <AppBadge label={statusKey(item.status)} variant={sv.variant} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.meta}>{t('preparationReview.servant')}{name}</Text>
            <Text style={styles.meta}>{t('preparationReview.lessonDate')}{item.lessonDate}</Text>
          </View>
          {canReview && (
            <View style={styles.reviewHint}>
              <Text style={styles.reviewHintText}>{'👆 '}{t('preparationReview.title')}</Text>
            </View>
          )}
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
      <Text style={styles.heading}>{t('preparationReview.title')}</Text>
      <FlatList
        data={preparations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPrep}
        contentContainerStyle={styles.list}
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

                {selectedPrep.description ? (
                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>{selectedPrep.description}</Text>
                  </View>
                ) : null}

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
  container: { flex: 1, backgroundColor: CREAM, paddingHorizontal: 16, paddingTop: 16 },
  heading: { ...typography.sectionHeading, color: NAVY, marginBottom: 16 },
  list: { gap: 12, paddingBottom: 24 },
  card: {},
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { ...typography.cardTitle, color: NAVY, flex: 1, marginRight: 8 },
  cardBody: { gap: 4 },
  meta: { ...typography.body, color: MUTED },
  reviewHint: { marginTop: 8, backgroundColor: '#eceae4', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignItems: 'center' },
  reviewHintText: { ...typography.caption, color: MUTED },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CREAM },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalScroll: { flex: 1 },
  modalContent: { backgroundColor: OFF_WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { ...typography.subHeading, color: NAVY, flex: 1, marginRight: 16 },
  modalClose: { fontSize: 22, color: MUTED },

  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailLabel: { ...typography.body, color: MUTED, width: 90 },
  detailValue: { ...typography.body, color: NAVY, flex: 1 },

  descriptionBox: { backgroundColor: CREAM, borderRadius: 12, padding: 12, marginTop: 8, marginBottom: 16 },
  descriptionText: { ...typography.body, color: NAVY },

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
});
