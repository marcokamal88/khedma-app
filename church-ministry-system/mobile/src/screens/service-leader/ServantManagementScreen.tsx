import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { useActiveContext } from '../../hooks/useActiveContext';
import { servantAssignmentsApi } from '../../api/servant-assignments.api';
import { churchApi } from '../../api/church.api';
import { AppAvatar, AppCard, AppBadge, AppButton, AppEmptyState } from '../../components/ui';
import { colors, typography, shadows } from '../../theme';

const NAVY = colors.navy;
const GOLD = colors.gold;
const CREAM = colors.cream;
const OFF_WHITE = colors.offWhite;
const MUTED = colors.mutedGray;
const GREEN = colors.success;

export default function ServantManagementScreen({ navigation }: any) {
  const { t } = useLocale();
  const { serviceId } = useActiveContext();
  const serviceIdStr = serviceId != null ? String(serviceId) : undefined;
  const [servants, setServants] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [editClassId, setEditClassId] = useState<string>('');
  const [editRole, setEditRole] = useState<string>('servant');
  const [saving, setSaving] = useState(false);

  // assign modal
  const [showAssign, setShowAssign] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [assignClassId, setAssignClassId] = useState('');
  const [assignRole, setAssignRole] = useState('servant');

  const loadData = useCallback(async () => {
    if (!serviceIdStr) return;
    setLoading(true);
    try {
      const [servantsRes, classesRes] = await Promise.all([
        servantAssignmentsApi.getAll(serviceIdStr),
        churchApi.getClasses(serviceIdStr),
      ]);
      setServants(servantsRes?.data || []);
      setClasses(classesRes?.data || []);
    } catch {
      setServants([]);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [serviceIdStr]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openEdit = (item: any) => {
    setSelected(item);
    setEditClassId(String(item.classId || ''));
    setEditRole(item.leaderRole || 'servant');
  };

  const openAssignForMember = (item: any) => {
    setSelectedMember({ id: item.churchMemberId, fullName: item.fullName, email: item.email, phone: item.phone, avatarUrl: item.avatarUrl });
    setShowAssign(true);
  };

  const closeEdit = () => {
    setSelected(null);
    setEditClassId('');
    setEditRole('servant');
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await servantAssignmentsApi.update(String(selected.id), {
        classId: editClassId || undefined,
        leaderRole: editRole,
      });
      Alert.alert('', t('servantManagement.updatedSuccess'));
      closeEdit();
      loadData();
    } catch (err: any) {
      Alert.alert('', err?.message || t('app.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = () => {
    if (!selected) return;
    Alert.alert('', t('servantManagement.deactivateConfirm'), [
      { text: t('app.cancel'), style: 'cancel' },
      {
        text: t('servantManagement.deactivate'),
        style: 'destructive',
        onPress: async () => {
          try {
            await servantAssignmentsApi.remove(String(selected.id));
            Alert.alert('', t('servantManagement.deactivatedSuccess'));
            closeEdit();
            loadData();
          } catch (err: any) {
            Alert.alert('', err?.message || t('app.error'));
          }
        },
      },
    ]);
  };

  const searchMembers = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await churchApi.searchMembers(q.trim(), serviceIdStr);
      setSearchResults(res?.data || []);
    } catch {
      setSearchResults([]);
    }
  }, [serviceIdStr]);

  const handleAssign = async () => {
    if (!selectedMember || !serviceIdStr) return;
    setSaving(true);
    try {
      await servantAssignmentsApi.create({
        churchMemberId: String(selectedMember.id),
        serviceId: serviceIdStr,
        classId: assignClassId,
        leaderRole: assignRole,
      });
      Alert.alert('', t('servantManagement.assignedSuccess'));
      setShowAssign(false);
      resetAssign();
      loadData();
    } catch (err: any) {
      Alert.alert('', err?.message || t('app.error'));
    } finally {
      setSaving(false);
    }
  };

  const resetAssign = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMember(null);
    setAssignClassId('');
    setAssignRole('servant');
  };

  const renderServant = ({ item }: { item: any }) => {
    const isAssigned = !!item.id;
    const isClassLeader = item.leaderRole === 'class_leader';
    return (
      <TouchableOpacity
        onPress={() => isAssigned ? openEdit(item) : openAssignForMember(item)}
        activeOpacity={0.7}
      >
        <AppCard variant="bordered" style={styles.card}>
          <View style={styles.cardRow}>
            <AppAvatar name={item.fullName || ''} size={44} style={styles.avatar} />
            <View style={styles.cardInfo}>
              <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
              {isAssigned ? (
                <View style={styles.cardMetaRow}>
                  {item.className ? (
                    <Text style={styles.className} numberOfLines={1}>{item.className}</Text>
                  ) : null}
                  <AppBadge
                    label={isClassLeader ? t('servantManagement.classLeader') : t('servantManagement.servant')}
                    style={isClassLeader ? styles.badgeGold : styles.badgeNavy}
                  />
                </View>
              ) : (
                <Text style={styles.notAssigned}>{t('servantManagement.notAssigned')}</Text>
              )}
            </View>
            {isAssigned && <Text style={styles.chevron}>{'\u203A'}</Text>}
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
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.headerBack}>{'\u2039'}</Text>
        </TouchableOpacity>
        <Text style={styles.heading} numberOfLines={1}>{t('servantManagement.title')}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { resetAssign(); setShowAssign(true); }}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.waveContainer} />

      <FlatList
        data={servants}
        keyExtractor={(item) => String(item.churchMemberId)}
        renderItem={renderServant}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <AppEmptyState icon="users" title={t('servantManagement.noServants')} />
        }
      />

      {/* Edit Modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
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
            {selected && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('servantManagement.edit')}</Text>
                  <TouchableOpacity onPress={closeEdit} activeOpacity={0.7}>
                    <Text style={styles.modalClose}>{'\u2715'}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.selectedName}>{selected.fullName}</Text>

                <Text style={styles.label}>{t('servantManagement.selectClass')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsRow}>
                  <TouchableOpacity
                    style={[styles.optionChip, !editClassId && styles.optionChipActive]}
                    onPress={() => setEditClassId('')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionChipText, !editClassId && styles.optionChipTextActive]}>--</Text>
                  </TouchableOpacity>
                  {classes.map((c: any) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.optionChip, editClassId === String(c.id) && styles.optionChipActive]}
                      onPress={() => setEditClassId(String(c.id))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.optionChipText, editClassId === String(c.id) && styles.optionChipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.label}>{t('servantManagement.selectRole')}</Text>
                <View style={styles.roleRow}>
                  <TouchableOpacity
                    style={[styles.roleBtn, editRole === 'servant' && styles.roleBtnActive]}
                    onPress={() => setEditRole('servant')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.roleBtnText, editRole === 'servant' && styles.roleBtnTextActive]}>
                      {t('servantManagement.servant')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleBtn, editRole === 'class_leader' && styles.roleBtnActive]}
                    onPress={() => setEditRole('class_leader')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.roleBtnText, editRole === 'class_leader' && styles.roleBtnTextActive]}>
                      {t('servantManagement.classLeader')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <AppButton
                  title={t('app.save')}
                  onPress={handleUpdate}
                  loading={saving}
                  variant="navy"
                  style={styles.saveBtn}
                />

                <TouchableOpacity style={styles.deactivateBtn} onPress={handleDeactivate} activeOpacity={0.7}>
                  <Text style={styles.deactivateBtnText}>{t('servantManagement.deactivate')}</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Assign Modal */}
      <Modal
        visible={showAssign}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssign(false)}
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('servantManagement.assign')}</Text>
              <TouchableOpacity onPress={() => setShowAssign(false)} activeOpacity={0.7}>
                <Text style={styles.modalClose}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={searchMembers}
              placeholder={t('servantManagement.searchMember')}
              placeholderTextColor={MUTED}
            />

            {searchResults.length > 0 && !selectedMember && (
              <View style={styles.searchResults}>
                {searchResults.map((m: any) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.searchResultItem}
                    onPress={() => setSelectedMember(m)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.searchResultName}>{m.fullName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedMember && (
              <View style={styles.selectedMemberCard}>
                <Text style={styles.selectedName}>{selectedMember.fullName}</Text>
                <TouchableOpacity onPress={() => setSelectedMember(null)} activeOpacity={0.7}>
                  <Text style={styles.removeBtn}>{'\u2715'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedMember && (
              <>
                <Text style={styles.label}>{t('servantManagement.selectClass')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsRow}>
                  {classes.map((c: any) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.optionChip, assignClassId === String(c.id) && styles.optionChipActive]}
                      onPress={() => setAssignClassId(String(c.id))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.optionChipText, assignClassId === String(c.id) && styles.optionChipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.label}>{t('servantManagement.selectRole')}</Text>
                <View style={styles.roleRow}>
                  <TouchableOpacity
                    style={[styles.roleBtn, assignRole === 'servant' && styles.roleBtnActive]}
                    onPress={() => setAssignRole('servant')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.roleBtnText, assignRole === 'servant' && styles.roleBtnTextActive]}>
                      {t('servantManagement.servant')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleBtn, assignRole === 'class_leader' && styles.roleBtnActive]}
                    onPress={() => setAssignRole('class_leader')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.roleBtnText, assignRole === 'class_leader' && styles.roleBtnTextActive]}>
                      {t('servantManagement.classLeader')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <AppButton
                  title={t('servantManagement.assign')}
                  onPress={handleAssign}
                  loading={saving}
                  disabled={!assignClassId}
                  variant="navy"
                />
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
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBack: { fontSize: 24, color: '#ffffff', lineHeight: 26 },
  heading: { ...typography.subHeading, color: '#ffffff', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 24, color: '#ffffff', lineHeight: 26, fontWeight: '700' },
  waveContainer: {
    height: 30,
    backgroundColor: NAVY,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 0,
  },
  list: { padding: 16, gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { backgroundColor: NAVY, marginEnd: 12 },
  cardInfo: { flex: 1 },
  name: { ...typography.cardTitle, color: NAVY, marginBottom: 4 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  className: { ...typography.caption, color: MUTED, flexShrink: 1 },
  notAssigned: { ...typography.caption, color: MUTED, fontStyle: 'italic' },
  badgeGold: { backgroundColor: GOLD },
  badgeNavy: { backgroundColor: NAVY },
  chevron: { fontSize: 24, color: MUTED, marginStart: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CREAM },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalScroll: { flex: 1 },
  modalContent: { backgroundColor: OFF_WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { ...typography.subHeading, color: NAVY, flex: 1, marginRight: 16 },
  modalClose: { fontSize: 22, color: MUTED },
  selectedName: { ...typography.cardTitle, color: NAVY, marginBottom: 16, textAlign: 'center' },

  label: { ...typography.body, color: MUTED, marginBottom: 8, marginTop: 12 },
  optionsRow: { marginBottom: 4 },
  optionChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: CREAM, marginRight: 8, borderWidth: 1, borderColor: '#eceae4' },
  optionChipActive: { backgroundColor: NAVY, borderColor: NAVY },
  optionChipText: { ...typography.buttonSmall, color: MUTED },
  optionChipTextActive: { color: '#ffffff' },

  roleRow: { flexDirection: 'row', gap: 12 },
  roleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: CREAM, alignItems: 'center', borderWidth: 1, borderColor: '#eceae4' },
  roleBtnActive: { backgroundColor: NAVY, borderColor: NAVY },
  roleBtnText: { ...typography.button, color: MUTED },
  roleBtnTextActive: { color: '#ffffff' },

  saveBtn: { marginTop: 20 },
  deactivateBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  deactivateBtnText: { ...typography.button, color: '#c62828' },

  searchInput: { backgroundColor: CREAM, borderRadius: 28, paddingHorizontal: 16, paddingVertical: 12, ...typography.body, color: NAVY, marginBottom: 12 },
  searchResults: { backgroundColor: CREAM, borderRadius: 12, padding: 8, marginBottom: 12 },
  searchResultItem: { paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#eceae4' },
  searchResultName: { ...typography.body, color: NAVY },
  selectedMemberCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: CREAM, borderRadius: 12, padding: 12, marginBottom: 12 },
  removeBtn: { fontSize: 18, color: MUTED },
});
