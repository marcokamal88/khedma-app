import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView, Share,
} from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { churchApi } from '../../api/church.api';
import { AppAvatar, AppCard, AppButton, AppEmptyState } from '../../components/ui';
import { colors, typography, shadows } from '../../theme';

const NAVY = colors.navy;
const GOLD = colors.gold;
const CREAM = colors.cream;
const OFF_WHITE = colors.offWhite;
const MUTED = colors.mutedGray;

export default function MyStudentsScreen({ navigation }: any) {
  const { t } = useLocale();
  const [assignment, setAssignment] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noClass, setNoClass] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setNoClass(false);
    try {
      const assignmentRes: any = await churchApi.getMyClass();
      const current = assignmentRes?.data || assignmentRes;
      setAssignment(current);
      const classId = String(current.class.id);
      const studentsRes: any = await churchApi.getClassStudents(classId);
      setStudents(studentsRes?.data || []);
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.message?.includes('No class assignment')) {
        setNoClass(true);
      }
      setAssignment(null);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const resetAdd = () => {
    setNewName('');
    setNewUsername('');
    setNewPhone('');
    setNewGender('');
    setNewPassword('');
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newUsername.trim() || newPassword.trim().length < 6) {
      Alert.alert('', t('auth.credentialsRequired'));
      return;
    }
    setSaving(true);
    try {
      const username = newUsername.trim().toLowerCase();
      const password = newPassword.trim();
      await churchApi.registerMember({
        fullName: newName.trim(),
        username,
        phone: newPhone.trim() || undefined,
        password,
        gender: newGender || undefined,
      });
      setShowAdd(false);
      resetAdd();
      loadData();
      Alert.alert(
        t('auth.credentialsCreated'),
        `${t('auth.username')}: ${username}\n${t('auth.tempPassword')}: ${password}`,
        [
          { text: t('app.cancel'), style: 'cancel' },
          {
            text: t('app.share'),
            onPress: () => Share.share({
              message: `${t('auth.username')}: ${username}\n${t('auth.tempPassword')}: ${password}`,
            }),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert('', err?.response?.data?.message || err?.message || t('app.error'));
    } finally {
      setSaving(false);
    }
  };

  const renderStudent = ({ item }: { item: any }) => (
    <AppCard variant="bordered" style={styles.card}>
      <View style={styles.cardRow}>
        <AppAvatar name={item.fullName || ''} size={44} style={styles.avatar} />
        <View style={styles.cardInfo}>
          <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
          {item.phone ? <Text style={styles.sub} numberOfLines={1}>{item.phone}</Text> : null}
        </View>
      </View>
    </AppCard>
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.headerBack}>{'\u2039'}</Text>
        </TouchableOpacity>
        <Text style={styles.heading} numberOfLines={1}>{t('studentsManagement.title')}</Text>
        <TouchableOpacity
          style={[styles.addBtn, noClass && styles.addBtnDisabled]}
          onPress={() => setShowAdd(true)}
          disabled={noClass}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.waveContainer} />

      {assignment?.class && (
        <View style={styles.classCard}>
          <Text style={styles.classLabel}>{assignment.class.name}</Text>
          <Text style={styles.classMeta}>{students.length} {t('studentsManagement.students') || ''}</Text>
        </View>
      )}

      <FlatList
        data={students}
        keyExtractor={(item) => String(item.enrollmentId || item.id)}
        renderItem={renderStudent}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <AppEmptyState
            icon="users"
            title={noClass ? (t('studentsManagement.noClass') || t('studentsManagement.noStudents')) : t('studentsManagement.noStudents')}
          />
        }
      />

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.sheetWrapper}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('studentsManagement.addStudent') || t('attendance.addStudent')}</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)} activeOpacity={0.7}>
                <Text style={styles.modalClose}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder={t('auth.fullName')}
                placeholderTextColor={MUTED}
              />
              <TextInput
                style={styles.input}
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder={t('auth.username')}
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder={t('auth.phonePlaceholder') || t('parent.phonePlaceholder')}
                placeholderTextColor={MUTED}
                keyboardType="phone-pad"
              />
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[styles.genderBtn, newGender === 'male' && styles.genderActive]}
                  onPress={() => setNewGender('male')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genderText, newGender === 'male' && styles.genderTextActive]}>{t('home.male')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderBtn, newGender === 'female' && styles.genderActive]}
                  onPress={() => setNewGender('female')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genderText, newGender === 'female' && styles.genderTextActive]}>{t('home.female')}</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={t('auth.tempPassword')}
                placeholderTextColor={MUTED}
                secureTextEntry
              />
              <AppButton
                title={t('attendance.register') || t('app.save')}
                onPress={handleAdd}
                loading={saving}
                variant="navy"
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { fontSize: 24, color: '#ffffff', lineHeight: 26, fontWeight: '700' },
  waveContainer: { height: 30, backgroundColor: NAVY, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  classCard: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border },
  classLabel: { ...typography.cardTitle, color: NAVY },
  classMeta: { ...typography.caption, color: MUTED, marginTop: 2 },
  list: { padding: 16, gap: 12, paddingBottom: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { backgroundColor: NAVY, marginEnd: 12 },
  cardInfo: { flex: 1 },
  name: { ...typography.cardTitle, color: NAVY, marginBottom: 2, textAlign: 'right', writingDirection: 'rtl' },
  sub: { ...typography.caption, color: MUTED, textAlign: 'right', writingDirection: 'rtl' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CREAM },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetWrapper: { backgroundColor: OFF_WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', width: '100%', overflow: 'hidden' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 12 },
  modalTitle: { ...typography.subHeading, color: NAVY, flex: 1, marginRight: 12, textAlign: 'right' },
  modalClose: { fontSize: 22, color: MUTED, paddingHorizontal: 8 },
  sheetContent: { padding: 20, paddingBottom: 60 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, ...typography.body, color: NAVY, marginBottom: 10 },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  genderActive: { backgroundColor: NAVY, borderColor: NAVY },
  genderText: { ...typography.buttonSmall, color: MUTED },
  genderTextActive: { color: '#ffffff' },
});
