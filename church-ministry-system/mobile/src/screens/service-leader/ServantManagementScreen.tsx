import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { useActiveContext } from '../../hooks/useActiveContext';
import { servantAssignmentsApi } from '../../api/servant-assignments.api';
import { churchApi } from '../../api/church.api';
import { AppCard, AppBadge, AppButton, AppEmptyState } from '../../components/ui';
import { colors, typography } from '../../theme';

const NAVY = '#192f5f';
const CREAM = '#f7f4ed';
const OFF_WHITE = '#fcfbf8';
const MUTED = '#5f5f5d';
const GREEN = '#2e7d32';

export default function ServantManagementScreen({ navigation }: any) {
  const { t } = useLocale();
  const { serviceId } = useActiveContext();
  const [servants, setServants] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (!serviceId) return;
    setLoading(true);
    try {
      const [servantsRes, classesRes] = await Promise.all([
        servantAssignmentsApi.getAll(serviceId),
        churchApi.getClasses(serviceId),
      ]);
      setServants(servantsRes?.data || []);
      setClasses(classesRes?.data || []);
    } catch {
      setServants([]);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openEdit = (item: any) => {
    setSelected(item);
    setEditClassId(String(item.classId || ''));
    setEditRole(item.leaderRole || 'servant');
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
      const res = await churchApi.searchMembers(q.trim());
      setSearchResults(res?.data || []);
    } catch {
      setSearchResults([]);
    }
  }, []);

  const handleAssign = async () => {
    if (!selectedMember || !serviceId) return;
    setSaving(true);
    try {
      await servantAssignmentsApi.create({
        churchMemberId: String(selectedMember.id),
        serviceId,
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

  const renderServant = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => openEdit(item)} activeOpacity={0.7}>
      <AppCard variant="bordered" style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardInfo}>
            <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
            <View style={styles.badges}>
              {item.className ? (
                <AppBadge label={item.className} variant="info" style={styles.badge} />
              ) : null}
              <AppBadge
                label={item.leaderRole === 'class_leader' ? t('servantManagement.classLeader') : t('servantManagement.servant')}
                variant={item.leaderRole === 'class_leader' ? 'warning' : 'neutral'}
                style={styles.badge}
              />
            </View>
          </View>
          <Text style={styles.chevron}>{'\u203A'}</Text>
        </View>
      </AppCard>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>{t('servantManagement.title')}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { resetAssign(); setShowAssign(true); }}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={servants}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderServant}
        contentContainerStyle={styles.list}
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
  container: { flex: 1, backgroundColor: CREAM, paddingHorizontal: 16, paddingTop: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { ...typography.sectionHeading, color: NAVY },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 22, color: '#ffffff', lineHeight: 24 },
  list: { gap: 12, paddingBottom: 24 },
  card: {},
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardInfo: { flex: 1 },
  name: { ...typography.cardTitle, color: NAVY, marginBottom: 4 },
  badges: { flexDirection: 'row', gap: 6 },
  badge: {},
  chevron: { fontSize: 24, color: MUTED, marginLeft: 8 },
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

  searchInput: { backgroundColor: CREAM, borderRadius: 12, padding: 12, ...typography.body, color: NAVY, marginBottom: 12 },
  searchResults: { backgroundColor: CREAM, borderRadius: 12, padding: 8, marginBottom: 12 },
  searchResultItem: { paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#eceae4' },
  searchResultName: { ...typography.body, color: NAVY },
  selectedMemberCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: CREAM, borderRadius: 12, padding: 12, marginBottom: 12 },
  removeBtn: { fontSize: 18, color: MUTED },
});
