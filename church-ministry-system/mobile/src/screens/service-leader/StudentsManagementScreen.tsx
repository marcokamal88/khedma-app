import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { useActiveContext } from '../../hooks/useActiveContext';
import { churchApi } from '../../api/church.api';
import { AppAvatar, AppCard, AppButton, AppEmptyState } from '../../components/ui';
import CalendarPicker from '../../components/CalendarPicker';
import { colors, typography, shadows } from '../../theme';
import apiClient from '../../api/client';

const NAVY = colors.navy;
const GOLD = colors.gold;
const CREAM = colors.cream;
const OFF_WHITE = colors.offWhite;
const MUTED = colors.mutedGray;

export default function StudentsManagementScreen({ navigation, route }: any) {
  const { t } = useLocale();
  const { serviceId } = useActiveContext();
  const serviceIdStr = serviceId != null ? String(serviceId) : undefined;
  const initialClassId = route?.params?.classId ? String(route.params.classId) : null;

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(initialClassId);
  const [students, setStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<'search' | 'register'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showEditCalendar, setShowEditCalendar] = useState(false);
  const [editClassId, setEditClassId] = useState('');

  const loadClasses = useCallback(async () => {
    if (!serviceIdStr) return;
    try {
      const res: any = await churchApi.getClasses(serviceIdStr);
      setClasses(res?.data || []);
    } catch { setClasses([]); }
  }, [serviceIdStr]);

  const loadStudents = useCallback(async () => {
    if (!serviceIdStr) return;
    setLoading(true);
    try {
      if (selectedClassId) {
        const res: any = await churchApi.getClassStudents(selectedClassId);
        const list = res?.data || [];
        setStudents(list);
        setAllStudents(list);
      } else {
        // load all classes students
        const classesRes: any = await churchApi.getClasses(serviceIdStr);
        const clsList = classesRes?.data || [];
        const results = await Promise.all(clsList.map((c: any) => churchApi.getClassStudents(String(c.id)).then((r: any) => ({ classId: String(c.id), className: c.name, students: r?.data || [] })).catch(() => ({ classId: String(c.id), className: c.name, students: [] }))));
        const flat = results.flatMap((r: any) => r.students.map((s: any) => ({ ...s, className: r.className, classId: r.classId })));
        setStudents(flat);
        setAllStudents(flat);
      }
    } catch { setStudents([]); setAllStudents([]); } finally { setLoading(false); }
  }, [serviceIdStr, selectedClassId]);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { loadStudents(); }, [loadStudents]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadStudents(); setRefreshing(false); }, [loadStudents]);

  const searchMembers = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const res: any = await churchApi.searchMembers(q.trim(), serviceIdStr);
      setSearchResults(res?.data || []);
    } catch { setSearchResults([]); }
  }, [serviceIdStr]);

  const handleEnrollExisting = async () => {
    if (!selectedMember || !serviceIdStr) return;
    const targetClassId = selectedClassId || (classes[0] ? String(classes[0].id) : '');
    if (!targetClassId) { Alert.alert('', t('classManagement.noClasses')); return; }
    // capacity warn
    try {
      const res: any = await churchApi.getClassStudents(targetClassId);
      const count = (res?.data || []).length;
      const cls = classes.find((c: any) => String(c.id) === targetClassId);
      if (cls?.capacity && count >= cls.capacity) {
        const go = await new Promise<boolean>((resolve) => Alert.alert('', `الفصل ممتلئ (السعة ${cls.capacity}) — هل تريد المتابعة؟`, [{ text: t('app.cancel'), onPress: () => resolve(false), style: 'cancel' }, { text: 'متابعة', onPress: () => resolve(true) }]));
        if (!go) return;
      }
    } catch {}
    setSaving(true);
    try {
      const syRes: any = await apiClient.get('/service-years/current');
      const syId = syRes?.data?.id || syRes?.id;
      await churchApi.enrollMember({ churchMemberId: String(selectedMember.id), serviceId: serviceIdStr!, classId: targetClassId, serviceYearId: String(syId) });
      Alert.alert('', t('attendance.addedSuccess'));
      setShowAdd(false); setSelectedMember(null); setSearchQuery(''); setSearchResults([]);
      loadStudents();
    } catch (err: any) { Alert.alert('', err?.response?.data?.message || err?.message || t('app.error')); } finally { setSaving(false); }
  };

  const handleRegister = async () => {
    if (!newName.trim()) { Alert.alert('', t('attendance.searchPlaceholder')); return; }
    const targetClassId = selectedClassId || (classes[0] ? String(classes[0].id) : '');
    if (!targetClassId) { Alert.alert('', t('classManagement.noClasses')); return; }
    try {
      const res: any = await churchApi.getClassStudents(targetClassId);
      const count = (res?.data || []).length;
      const cls = classes.find((c: any) => String(c.id) === targetClassId);
      if (cls?.capacity && count >= cls.capacity) {
        const go = await new Promise<boolean>((resolve) => Alert.alert('', `الفصل ممتلئ (السعة ${cls.capacity}) — هل تريد المتابعة؟`, [{ text: t('app.cancel'), onPress: () => resolve(false), style: 'cancel' }, { text: 'متابعة', onPress: () => resolve(true) }]));
        if (!go) return;
      }
    } catch {}
    setSaving(true);
    try {
      const syRes: any = await apiClient.get('/service-years/current');
      const syId = syRes?.data?.id || syRes?.id;
      await churchApi.registerMember({ fullName: newName.trim(), phone: newPhone.trim() || undefined, password: newPassword.trim() || 'changeme123', serviceId: serviceIdStr!, classId: targetClassId, serviceYearId: String(syId), address: newAddress.trim() || undefined, birthDate: newBirthDate.trim() || undefined, notes: newNotes.trim() || undefined, gender: newGender || undefined } as any);
      Alert.alert('', t('attendance.addedSuccess'));
      setShowAdd(false); setNewName(''); setNewPhone(''); setNewGender(''); setNewAddress(''); setNewBirthDate(''); setNewNotes(''); setNewPassword('');
      loadStudents();
    } catch (err: any) { Alert.alert('', err?.response?.data?.message || err?.message || t('app.error')); } finally { setSaving(false); }
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setEditName(item.fullName || '');
    setEditPhone(item.phone || '');
    setEditGender((item as any).gender || '');
    setEditAddress((item as any).address || '');
    setEditBirthDate((item as any).birthDate || '');
    setEditNotes((item as any).notes || '');
    setEditClassId(String(item.classId || selectedClassId || ''));
  };
  const closeEdit = () => { setEditing(null); setEditName(''); setEditPhone(''); setEditGender(''); setEditAddress(''); setEditBirthDate(''); setEditNotes(''); setEditClassId(''); };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiClient.patch(`/members/${editing.id}`, { fullName: editName.trim() || undefined, phone: editPhone.trim() || undefined, gender: editGender || undefined, address: editAddress.trim() || undefined, birthDate: editBirthDate.trim() || undefined, notes: editNotes.trim() || undefined });
      if (editClassId && editClassId !== String(editing.classId)) {
        const syRes: any = await apiClient.get('/service-years/current');
        const syId = syRes?.data?.id || syRes?.id;
        // capacity warn for target class
        try {
          const res: any = await churchApi.getClassStudents(editClassId);
          const count = (res?.data || []).length;
          const cls = classes.find((c: any) => String(c.id) === editClassId);
          if (cls?.capacity && count >= cls.capacity) {
            const go = await new Promise<boolean>((resolve) => Alert.alert('', `الفصل ممتلئ (السعة ${cls.capacity}) — هل تريد المتابعة؟`, [{ text: t('app.cancel'), onPress: () => resolve(false), style: 'cancel' }, { text: 'متابعة', onPress: () => resolve(true) }]));
            if (!go) { setSaving(false); return; }
          }
        } catch {}
        await churchApi.enrollMember({ churchMemberId: String(editing.id), serviceId: serviceIdStr!, classId: editClassId, serviceYearId: String(syId) });
      }
      Alert.alert('', t('attendance.editStudent') + ' OK');
      closeEdit(); loadStudents();
    } catch (err: any) { Alert.alert('', err?.response?.data?.message || err?.message || t('app.error')); } finally { setSaving(false); }
  };

  const handleUnenroll = () => {
    if (!editing) return;
    Alert.alert('', 'هل تريد إلغاء تسجيل هذا المخدوم من الفصل؟', [
      { text: t('app.cancel'), style: 'cancel' },
      { text: t('app.delete'), style: 'destructive', onPress: async () => {
        try {
          await churchApi.unenrollStudent(String(editing.enrollmentId));
          Alert.alert('', 'تم إلغاء التسجيل');
          closeEdit(); loadStudents();
        } catch (err: any) { Alert.alert('', err?.response?.data?.message || err?.message || t('app.error')); }
      }},
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => openEdit(item)} activeOpacity={0.7}>
      <AppCard variant="bordered" style={styles.card}>
        <View style={styles.cardRow}>
          <AppAvatar name={item.fullName || ''} size={44} style={styles.avatar} />
          <View style={styles.cardInfo}>
            <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
            <Text style={styles.sub} numberOfLines={1}>{item.className || ''}{item.phone ? ` • ${item.phone}` : ''}</Text>
          </View>
          <Text style={styles.chevron}>{'\u203A'}</Text>
        </View>
      </AppCard>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={NAVY} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.headerBack}>{'\u2039'}</Text>
        </TouchableOpacity>
        <Text style={styles.heading} numberOfLines={1}>{t('studentsManagement.title') || 'إدارة المخدومين'}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setAddMode('search'); setShowAdd(true); }} activeOpacity={0.7}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.waveContainer} />
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <TouchableOpacity style={[styles.chip, !selectedClassId && styles.chipActive]} onPress={() => setSelectedClassId(null)} activeOpacity={0.7}>
            <Text style={[styles.chipText, !selectedClassId && styles.chipTextActive]}>الكل ({allStudents.length})</Text>
          </TouchableOpacity>
          {classes.map((c: any) => (
            <TouchableOpacity key={c.id} style={[styles.chip, selectedClassId === String(c.id) && styles.chipActive]} onPress={() => setSelectedClassId(String(c.id))} activeOpacity={0.7}>
              <Text style={[styles.chipText, selectedClassId === String(c.id) && styles.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList data={students} keyExtractor={(item) => String(item.enrollmentId || item.id)} renderItem={renderItem} contentContainerStyle={styles.list} refreshing={refreshing} onRefresh={onRefresh} ListEmptyComponent={<AppEmptyState icon="users" title={t('studentsManagement.noStudents') || 'لا يوجد مخدومين'} />} />

      {/* Add sheet */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.sheetWrapper}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{addMode === 'search' ? 'إضافة مخدوم' : 'تسجيل مخدوم جديد'}</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Text style={styles.modalClose}>{'\u2715'}</Text></TouchableOpacity>
            </View>
            <View style={[styles.tabRow, { paddingHorizontal: 20 }]}>
              <TouchableOpacity style={[styles.tabBtn, addMode === 'search' && styles.tabActive]} onPress={() => setAddMode('search')} activeOpacity={0.7}><Text style={[styles.tabText, addMode === 'search' && styles.tabTextActive]}>بحث</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, addMode === 'register' && styles.tabActive]} onPress={() => setAddMode('register')} activeOpacity={0.7}><Text style={[styles.tabText, addMode === 'register' && styles.tabTextActive]}>جديد</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {addMode === 'search' ? (
                <View>
                  <TextInput style={styles.input} value={searchQuery} onChangeText={searchMembers} placeholder={t('attendance.searchPlaceholder')} placeholderTextColor={MUTED} />
                  {searchResults.map((m: any) => (
                    <TouchableOpacity key={m.id} style={[styles.resultItem, selectedMember?.id === m.id && styles.resultSelected]} onPress={() => setSelectedMember(m)} activeOpacity={0.7}>
                      <Text style={styles.resultName}>{m.fullName}</Text>
                    </TouchableOpacity>
                  ))}
                  <AppButton title={t('attendance.addStudent') || 'إضافة'} onPress={handleEnrollExisting} loading={saving} disabled={!selectedMember} variant="navy" style={{ marginTop: 12 }} />
                </View>
              ) : (
                <View>
                  <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder={t('attendance.searchPlaceholder').replace('ابحث باسم الطالب...','الاسم')} placeholderTextColor={MUTED} />
                  <TextInput style={styles.input} value={newPhone} onChangeText={setNewPhone} placeholder={t('parent.phonePlaceholder') || 'phone'} placeholderTextColor={MUTED} keyboardType="phone-pad" />
                  <View style={styles.genderRow}>
                    <TouchableOpacity style={[styles.genderBtn, newGender === 'male' && styles.genderActive]} onPress={() => setNewGender('male')} activeOpacity={0.7}><Text style={[styles.genderText, newGender === 'male' && styles.genderTextActive]}>{t('home.male')}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.genderBtn, newGender === 'female' && styles.genderActive]} onPress={() => setNewGender('female')} activeOpacity={0.7}><Text style={[styles.genderText, newGender === 'female' && styles.genderTextActive]}>{t('home.female')}</Text></TouchableOpacity>
                  </View>
                  <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder={t('attendance.passwordPlaceholder')} placeholderTextColor={MUTED} secureTextEntry />
                  <TouchableOpacity style={styles.input} onPress={() => setShowCalendar(true)} activeOpacity={0.7}><Text style={{ color: newBirthDate ? NAVY : MUTED }}>{newBirthDate || t('attendance.birthDatePlaceholder')}</Text></TouchableOpacity>
                  <TextInput style={styles.input} value={newAddress} onChangeText={setNewAddress} placeholder={t('attendance.addressPlaceholder')} placeholderTextColor={MUTED} />
                  <TextInput style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]} value={newNotes} onChangeText={setNewNotes} placeholder={t('attendance.notesPlaceholder')} placeholderTextColor={MUTED} multiline />
                  <AppButton title={t('attendance.register') || 'تسجيل'} onPress={handleRegister} loading={saving} variant="navy" style={{ marginTop: 12 }} />
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit sheet */}
      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={closeEdit}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.sheetWrapper}>
            {editing && (
              <>
                <View style={styles.handle} />
                <View style={styles.modalHeader}><Text style={styles.modalTitle}>{t('attendance.editStudent')}</Text><TouchableOpacity onPress={closeEdit} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Text style={styles.modalClose}>{'\u2715'}</Text></TouchableOpacity></View>
                <ScrollView style={styles.modalScroll} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <Text style={styles.label}>الاسم</Text><TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholderTextColor={MUTED} />
                  <Text style={styles.label}>الهاتف</Text><TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} placeholderTextColor={MUTED} keyboardType="phone-pad" />
                  <Text style={styles.label}>النوع</Text>
                  <View style={styles.genderRow}>
                    <TouchableOpacity style={[styles.genderBtn, editGender === 'male' && styles.genderActive]} onPress={() => setEditGender('male')} activeOpacity={0.7}><Text style={[styles.genderText, editGender === 'male' && styles.genderTextActive]}>{t('home.male')}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.genderBtn, editGender === 'female' && styles.genderActive]} onPress={() => setEditGender('female')} activeOpacity={0.7}><Text style={[styles.genderText, editGender === 'female' && styles.genderTextActive]}>{t('home.female')}</Text></TouchableOpacity>
                  </View>
                  <Text style={styles.label}>تاريخ الميلاد</Text><TouchableOpacity style={styles.input} onPress={() => setShowEditCalendar(true)} activeOpacity={0.7}><Text style={{ color: editBirthDate ? NAVY : MUTED }}>{editBirthDate || t('attendance.birthDatePlaceholder')}</Text></TouchableOpacity>
                  <Text style={styles.label}>العنوان</Text><TextInput style={styles.input} value={editAddress} onChangeText={setEditAddress} placeholderTextColor={MUTED} />
                  <Text style={styles.label}>ملاحظات</Text><TextInput style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]} value={editNotes} onChangeText={setEditNotes} placeholderTextColor={MUTED} multiline />
                  <Text style={styles.label}>الفصل</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {classes.map((c: any) => (
                      <TouchableOpacity key={c.id} style={[styles.chip, editClassId === String(c.id) && styles.chipActive]} onPress={() => setEditClassId(String(c.id))} activeOpacity={0.7}>
                        <Text style={[styles.chipText, editClassId === String(c.id) && styles.chipTextActive]}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <AppButton title={t('app.save')} onPress={handleSaveEdit} loading={saving} variant="navy" style={{ marginTop: 16 }} />
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleUnenroll} activeOpacity={0.7}><Text style={styles.deleteBtnText}>إلغاء التسجيل من الفصل</Text></TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <CalendarPicker visible={showCalendar} onClose={() => setShowCalendar(false)} onSelect={(d: string) => { setNewBirthDate(d); setShowCalendar(false); }} />
      <CalendarPicker visible={showEditCalendar} onClose={() => setShowEditCalendar(false)} onSelect={(d: string) => { setEditBirthDate(d); setShowEditCalendar(false); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerBack: { fontSize: 24, color: '#ffffff', lineHeight: 26 },
  heading: { ...typography.subHeading, color: '#ffffff', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 24, color: '#ffffff', lineHeight: 26, fontWeight: '700' },
  waveContainer: { height: 30, backgroundColor: NAVY, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  filterRow: { paddingHorizontal: 16, paddingTop: 12 },
  chips: { gap: 8, paddingRight: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: NAVY, borderColor: NAVY },
  chipText: { ...typography.caption, color: MUTED },
  chipTextActive: { color: '#ffffff' },
  list: { padding: 16, gap: 12, paddingBottom: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { backgroundColor: NAVY, marginEnd: 12 },
  cardInfo: { flex: 1 },
  name: { ...typography.cardTitle, color: NAVY, marginBottom: 2 },
  sub: { ...typography.caption, color: MUTED },
  chevron: { fontSize: 24, color: MUTED, marginStart: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CREAM },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetWrapper: { backgroundColor: OFF_WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '85%', maxHeight: '85%', width: '100%', overflow: 'hidden' },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20, paddingBottom: 40 },
  sheetContent: { padding: 20, paddingBottom: 60, flexGrow: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 12 },
  modalTitle: { ...typography.subHeading, color: NAVY, flex: 1, marginRight: 12, textAlign: 'right' },
  modalClose: { fontSize: 22, color: MUTED, paddingHorizontal: 8 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: CREAM, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: NAVY, borderColor: NAVY },
  tabText: { ...typography.buttonSmall, color: MUTED },
  tabTextActive: { color: '#ffffff' },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, ...typography.body, color: NAVY, marginBottom: 10 },
  resultItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border, borderRadius: 8 },
  resultSelected: { backgroundColor: '#eef2f7' },
  resultName: { ...typography.body, color: NAVY },
  label: { ...typography.caption, color: MUTED, marginBottom: 6, marginTop: 8 },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  genderActive: { backgroundColor: NAVY, borderColor: NAVY },
  genderText: { ...typography.buttonSmall, color: MUTED },
  genderTextActive: { color: '#ffffff' },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  deleteBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  deleteBtnText: { ...typography.button, color: '#c62828' },
});
