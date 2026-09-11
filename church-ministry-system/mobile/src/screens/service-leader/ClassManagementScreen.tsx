import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { useActiveContext } from '../../hooks/useActiveContext';
import { churchApi } from '../../api/church.api';
import { AppCard, AppButton, AppEmptyState } from '../../components/ui';
import { AppBottomSheet } from '../../components/ui/AppBottomSheet';
import { colors, typography, shadows } from '../../theme';

const NAVY = colors.navy;
const GOLD = colors.gold;
const CREAM = colors.cream;
const OFF_WHITE = colors.offWhite;
const MUTED = colors.mutedGray;

export default function ClassManagementScreen({ navigation }: any) {
  const { t } = useLocale();
  const { serviceId } = useActiveContext();
  const serviceIdStr = serviceId != null ? String(serviceId) : undefined;
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!serviceIdStr) return;
    setLoading(true);
    try {
      const res = await churchApi.getClasses(serviceIdStr);
      setClasses(res?.data || []);
    } catch {
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

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setCapacity('');
    setSheetVisible(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setName(item.name || '');
    setCapacity(item.capacity != null ? String(item.capacity) : '');
    setSheetVisible(true);
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setEditing(null);
    setName('');
    setCapacity('');
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      Alert.alert('', t('classManagement.nameRequired'));
      return;
    }
    const cap = capacity.trim() === '' ? null : Number(capacity.trim());
    if (cap !== null && (!Number.isInteger(cap) || cap <= 0)) {
      Alert.alert('', t('classManagement.capacityInvalid'));
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await churchApi.updateClass(String(editing.id), { name: trimmed, capacity: cap });
        Alert.alert('', t('classManagement.updatedSuccess'));
      } else {
        await churchApi.createClass({ name: trimmed, capacity: cap });
        Alert.alert('', t('classManagement.createdSuccess'));
      }
      closeSheet();
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t('app.error');
      Alert.alert('', String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert('', t('classManagement.deleteConfirm'), [
      { text: t('app.cancel'), style: 'cancel' },
      {
        text: t('app.delete'),
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await churchApi.deleteClass(String(editing.id));
            Alert.alert('', t('classManagement.deletedSuccess'));
            closeSheet();
            loadData();
          } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || t('app.error');
            Alert.alert('', String(msg));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => openEdit(item)} activeOpacity={0.7}>
      <AppCard variant="bordered" style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>{'\u25A3'}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            {item.capacity ? <Text style={styles.capacity}>{t('classManagement.capacity')}: {item.capacity}</Text> : null}
          </View>
          <Text style={styles.chevron}>{'\u203A'}</Text>
        </View>
      </AppCard>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={NAVY} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.headerBack}>{'\u2039'}</Text>
        </TouchableOpacity>
        <Text style={styles.heading} numberOfLines={1}>{t('classManagement.title')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.7}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.waveContainer} />
      <FlatList
        data={classes}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<AppEmptyState icon="layers" title={t('classManagement.noClasses')} />}
      />
      <AppBottomSheet visible={sheetVisible} onClose={closeSheet} title={editing ? t('classManagement.edit') : t('classManagement.create')}>
        <Text style={styles.label}>{t('classManagement.name')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('classManagement.namePlaceholder')}
          placeholderTextColor={MUTED}
        />
        <Text style={styles.label}>{t('classManagement.capacity')}</Text>
        <TextInput
          style={styles.input}
          value={capacity}
          onChangeText={setCapacity}
          placeholder={t('classManagement.capacityPlaceholder')}
          placeholderTextColor={MUTED}
          keyboardType="number-pad"
        />
        <AppButton title={t('app.save')} onPress={handleSave} loading={saving} variant="navy" style={{ marginTop: 16 }} />
        {editing && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7} disabled={saving}>
            <Text style={styles.deleteBtnText}>{t('app.delete')}</Text>
          </TouchableOpacity>
        )}
      </AppBottomSheet>
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
  list: { padding: 16, gap: 12, paddingBottom: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', marginEnd: 12 },
  iconText: { fontSize: 16, color: '#ffffff' },
  cardInfo: { flex: 1 },
  name: { ...typography.cardTitle, color: NAVY, marginBottom: 2 },
  capacity: { ...typography.caption, color: MUTED },
  chevron: { fontSize: 24, color: MUTED, marginStart: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CREAM },
  label: { ...typography.body, color: MUTED, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: CREAM, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, ...typography.body, color: NAVY, borderWidth: 1, borderColor: colors.border },
  deleteBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  deleteBtnText: { ...typography.button, color: '#c62828' },
});
