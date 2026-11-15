import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';
import { churchApi } from '../../api/church.api';
import AppHeader from '../../components/AppHeader';
import { typography, shadows } from '../../theme';

const NAVY = '#192f5f';
const CREAM = '#f7f4ed';
const GOLD = '#d4a843';
const CHARCOAL = '#1c1c1c';
const MUTED = '#6b7280';
const GREEN = '#10b981';
const BORDER = '#e5e7eb';

export default function SectorManagementScreen({ navigation }: any) {
  const { t } = useLocale();
  const { activeContext } = useAuth();

  const [activeTab, setActiveTab] = useState<'services' | 'servants'>('services');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sector Data
  const [sectorOverview, setSectorOverview] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);

  // Servants Data
  const [servants, setServants] = useState<any[]>([]);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');

  // Modals state
  const [showAddServantModal, setShowAddServantModal] = useState(false);
  const [showAssignLeaderModal, setShowAssignLeaderModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);

  // Selected item for action
  const [selectedServiceForLeader, setSelectedServiceForLeader] = useState<any>(null);
  const [selectedServantForReassign, setSelectedServantForReassign] = useState<any>(null);

  // Forms
  const [newServantForm, setNewServantForm] = useState({
    fullName: '',
    username: '',
    phone: '',
    password: '',
    serviceId: '',
    classId: '',
    gender: 'male',
  });

  const [assignLeaderForm, setAssignLeaderForm] = useState({
    churchMemberId: '',
    leaderRole: 'service_leader' as 'service_leader' | 'assistant_service_leader',
    searchQuery: '',
  });

  const [reassignForm, setReassignForm] = useState({
    targetServiceId: '',
    targetClassId: '',
    leaderRole: 'servant',
  });

  // Available classes for selected services in modals
  const [availableClassesForAdd, setAvailableClassesForAdd] = useState<any[]>([]);
  const [availableClassesForReassign, setAvailableClassesForReassign] = useState<any[]>([]);
  const [searchedMembers, setSearchedMembers] = useState<any[]>([]);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [overviewRes, servantsRes] = await Promise.all([
        churchApi.getMySectorOverview(),
        churchApi.getServantAssignments(selectedServiceFilter === 'all' ? undefined : selectedServiceFilter),
      ]);
      setSectorOverview(overviewRes.data);
      setServices(overviewRes.data.services || []);
      setServants(servantsRes.data || []);
    } catch (err: any) {
      console.warn('Failed to load sector data', err);
    } finally {
      setLoading(false);
    }
  }, [selectedServiceFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When service changes in Add Servant Modal, fetch its classes
  const handleServiceChangeForAdd = async (serviceId: string) => {
    setNewServantForm((prev) => ({ ...prev, serviceId, classId: '' }));
    if (!serviceId) {
      setAvailableClassesForAdd([]);
      return;
    }
    try {
      const res = await churchApi.getClasses(serviceId);
      setAvailableClassesForAdd(res.data || []);
    } catch {
      setAvailableClassesForAdd([]);
    }
  };

  // When target service changes in Reassign Modal, fetch its classes
  const handleServiceChangeForReassign = async (serviceId: string) => {
    setReassignForm((prev) => ({ ...prev, targetServiceId: serviceId, targetClassId: '' }));
    if (!serviceId) {
      setAvailableClassesForReassign([]);
      return;
    }
    try {
      const res = await churchApi.getClasses(serviceId);
      setAvailableClassesForReassign(res.data || []);
    } catch {
      setAvailableClassesForReassign([]);
    }
  };

  // Member search for leader assignment
  const handleSearchMembers = async (q: string) => {
    setAssignLeaderForm((prev) => ({ ...prev, searchQuery: q }));
    if (!q || q.length < 2) {
      setSearchedMembers([]);
      return;
    }
    setSearchingMembers(true);
    try {
      const res = await churchApi.searchMembers(q);
      setSearchedMembers(res.data || []);
    } catch {
      setSearchedMembers([]);
    } finally {
      setSearchingMembers(false);
    }
  };

  // Submit Add Servant
  const handleCreateServant = async () => {
    if (!newServantForm.fullName || !newServantForm.username || !newServantForm.password || !newServantForm.classId) {
      Alert.alert('تنبيه', 'يرجى إدخال كافة الحقول واختيار الخدمة والفصل');
      return;
    }
    setSubmitting(true);
    try {
      await churchApi.createServant({
        fullName: newServantForm.fullName,
        username: newServantForm.username,
        phone: newServantForm.phone || undefined,
        password: newServantForm.password,
        serviceId: newServantForm.serviceId,
        classId: newServantForm.classId,
        gender: newServantForm.gender,
      });
      Alert.alert('نجاح', 'تم تسجيل وتسكين الخادم بنجاح');
      setShowAddServantModal(false);
      setNewServantForm({
        fullName: '',
        username: '',
        phone: '',
        password: '',
        serviceId: '',
        classId: '',
        gender: 'male',
      });
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء إضافة الخادم';
      Alert.alert('خطأ', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Assign Leader
  const handleAssignLeader = async () => {
    if (!assignLeaderForm.churchMemberId || !selectedServiceForLeader) {
      Alert.alert('تنبيه', 'يرجى اختيار الخادم المراد تعيينه');
      return;
    }
    setSubmitting(true);
    try {
      await churchApi.assignServiceLeader({
        churchMemberId: String(assignLeaderForm.churchMemberId),
        serviceId: String(selectedServiceForLeader.id),
        leaderRole: assignLeaderForm.leaderRole,
      });
      Alert.alert('نجاح', 'تم تعيين أمين الخدمة بنجاح');
      setShowAssignLeaderModal(false);
      setAssignLeaderForm({ churchMemberId: '', leaderRole: 'service_leader', searchQuery: '' });
      setSelectedServiceForLeader(null);
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء تعيين أمين الخدمة';
      Alert.alert('خطأ', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Reassign Servant
  const handleReassignServant = async () => {
    if (!selectedServantForReassign || !reassignForm.targetServiceId) {
      Alert.alert('تنبيه', 'يرجى اختيار الخدمة المستهدفة');
      return;
    }
    setSubmitting(true);
    try {
      await churchApi.reassignServant({
        assignmentId: selectedServantForReassign.id ? String(selectedServantForReassign.id) : undefined,
        churchMemberId: String(selectedServantForReassign.churchMemberId),
        targetServiceId: reassignForm.targetServiceId,
        targetClassId: reassignForm.targetClassId || undefined,
        leaderRole: reassignForm.leaderRole || 'servant',
      });
      Alert.alert('نجاح', 'تم نقل الخادم وتحديث تسكينه بنجاح');
      setShowReassignModal(false);
      setSelectedServantForReassign(null);
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء نقل الخادم';
      Alert.alert('خطأ', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AppHeader greetingText="إدارة القطاع">
        <View style={styles.headerContext}>
          <Text style={styles.sectorTitle}>
            {sectorOverview?.sector?.name || activeContext?.displayLabel || 'القطاع'}
          </Text>
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.8}
            onPress={() => setShowAddServantModal(true)}
          >
            <Text style={styles.addBtnText}>+ خادم جديد</Text>
          </TouchableOpacity>
        </View>
      </AppHeader>

      {/* Main Mode Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'services' && styles.tabItemActive]}
          onPress={() => setActiveTab('services')}
        >
          <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
            الخدمات والأمناء ({services.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'servants' && styles.tabItemActive]}
          onPress={() => setActiveTab('servants')}
        >
          <Text style={[styles.tabText, activeTab === 'servants' && styles.tabTextActive]}>
            خدام القطاع ({servants.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[NAVY]} />}
      >
        {activeTab === 'services' ? (
          /* ================= SERVICES & LEADERS TAB ================= */
          <View style={styles.servicesList}>
            {services.map((service) => {
              const serviceLeader = service.leaders?.find((l: any) => l.role === 'service_leader');
              const assistantLeader = service.leaders?.find((l: any) => l.role === 'assistant_service_leader');

              return (
                <View key={service.id} style={styles.serviceCard}>
                  <View style={styles.serviceCardHeader}>
                    <View style={styles.serviceNameWrap}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      {service.description ? (
                        <Text style={styles.serviceDesc}>{service.description}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={styles.assignLeaderBtn}
                      onPress={() => {
                        setSelectedServiceForLeader(service);
                        setShowAssignLeaderModal(true);
                      }}
                    >
                      <Text style={styles.assignLeaderBtnText}>تعيين أمين</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Leaders Row */}
                  <View style={styles.leadersBox}>
                    <View style={styles.leaderRow}>
                      <Text style={styles.leaderBadge}>أمين الخدمة</Text>
                      <Text style={styles.leaderName}>
                        {serviceLeader?.fullName || 'لم يُعيّن بعد'}
                      </Text>
                      {serviceLeader?.phone ? (
                        <Text style={styles.leaderPhone}>{serviceLeader.phone}</Text>
                      ) : null}
                    </View>
                    <View style={styles.leaderRow}>
                      <Text style={[styles.leaderBadge, { backgroundColor: '#f3f4f6', color: '#4b5563' }]}>
                        الأمين المساعد
                      </Text>
                      <Text style={styles.leaderName}>
                        {assistantLeader?.fullName || 'لم يُعيّن بعد'}
                      </Text>
                      {assistantLeader?.phone ? (
                        <Text style={styles.leaderPhone}>{assistantLeader.phone}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Stats Badges */}
                  <View style={styles.serviceStatsRow}>
                    <View style={styles.statPill}>
                      <Text style={styles.statValue}>{service.classesCount || 0}</Text>
                      <Text style={styles.statLabel}>فصول</Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={styles.statValue}>{service.servantsCount || 0}</Text>
                      <Text style={styles.statLabel}>خدام</Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={styles.statValue}>{service.studentsCount || 0}</Text>
                      <Text style={styles.statLabel}>مخدومين</Text>
                    </View>
                    <View style={[styles.statPill, { backgroundColor: '#ecfdf5' }]}>
                      <Text style={[styles.statValue, { color: GREEN }]}>
                        {service.attendanceRate || 0}%
                      </Text>
                      <Text style={[styles.statLabel, { color: GREEN }]}>حضور</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          /* ================= SERVANTS DISTRIBUTION TAB ================= */
          <View>
            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.filterChip, selectedServiceFilter === 'all' && styles.filterChipActive]}
                onPress={() => setSelectedServiceFilter('all')}
              >
                <Text style={[styles.filterChipText, selectedServiceFilter === 'all' && styles.filterChipTextActive]}>
                  الكل
                </Text>
              </TouchableOpacity>
              {services.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.filterChip, selectedServiceFilter === String(s.id) && styles.filterChipActive]}
                  onPress={() => setSelectedServiceFilter(String(s.id))}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedServiceFilter === String(s.id) && styles.filterChipTextActive,
                    ]}
                  >
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Servants List */}
            {servants.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>لا يوجد خدام مسجلين في هذا القسم</Text>
              </View>
            ) : (
              servants.map((servant, idx) => (
                <View key={servant.id || servant.churchMemberId || idx} style={styles.servantCard}>
                  <View style={styles.servantInfoRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {(servant.fullName || 'خ')[0]}
                      </Text>
                    </View>
                    <View style={styles.servantDetails}>
                      <Text style={styles.servantName}>{servant.fullName}</Text>
                      <Text style={styles.servantPhone}>{servant.phone || servant.email || 'بدون هاتف'}</Text>
                      <View style={styles.badgeRow}>
                        {servant.serviceName ? (
                          <View style={styles.serviceBadge}>
                            <Text style={styles.serviceBadgeText}>{servant.serviceName}</Text>
                          </View>
                        ) : null}
                        {servant.className ? (
                          <View style={styles.classBadge}>
                            <Text style={styles.classBadgeText}>{servant.className}</Text>
                          </View>
                        ) : (
                          <View style={[styles.classBadge, { backgroundColor: '#fef2f2' }]}>
                            <Text style={[styles.classBadgeText, { color: '#ef4444' }]}>غير مسكن بفصل</Text>
                          </View>
                        )}
                        {servant.leaderRole === 'class_leader' ? (
                          <View style={[styles.classBadge, { backgroundColor: '#fef3c7' }]}>
                            <Text style={[styles.classBadgeText, { color: '#b45309' }]}>أمين فصل</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  <View style={styles.servantActions}>
                    <TouchableOpacity
                      style={styles.reassignBtn}
                      onPress={() => {
                        setSelectedServantForReassign(servant);
                        setShowReassignModal(true);
                      }}
                    >
                      <Text style={styles.reassignBtnText}>نقل خادم</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ================= MODAL 1: ADD NEW SERVANT ================= */}
      <Modal visible={showAddServantModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>إضافة وتسكين خادم جديد</Text>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>الاسم بالكامل</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل اسم الخادم"
                value={newServantForm.fullName}
                onChangeText={(text) => setNewServantForm((p) => ({ ...p, fullName: text }))}
              />

              <Text style={styles.inputLabel}>اسم المستخدم (لتسجيل الدخول)</Text>
              <TextInput
                style={styles.input}
                placeholder="اسم المستخدم"
                autoCapitalize="none"
                value={newServantForm.username}
                onChangeText={(text) => setNewServantForm((p) => ({ ...p, username: text }))}
              />

              <Text style={styles.inputLabel}>رقم الهاتف</Text>
              <TextInput
                style={styles.input}
                placeholder="01xxxxxxxxx"
                keyboardType="phone-pad"
                value={newServantForm.phone}
                onChangeText={(text) => setNewServantForm((p) => ({ ...p, phone: text }))}
              />

              <Text style={styles.inputLabel}>كلمة المرور</Text>
              <TextInput
                style={styles.input}
                placeholder="كلمة المرور"
                secureTextEntry
                value={newServantForm.password}
                onChangeText={(text) => setNewServantForm((p) => ({ ...p, password: text }))}
              />

              <Text style={styles.inputLabel}>اختر الخدمة التابعة للقطاع</Text>
              <View style={styles.pillSelectorRow}>
                {services.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.choicePill,
                      newServantForm.serviceId === String(s.id) && styles.choicePillActive,
                    ]}
                    onPress={() => handleServiceChangeForAdd(String(s.id))}
                  >
                    <Text
                      style={[
                        styles.choicePillText,
                        newServantForm.serviceId === String(s.id) && styles.choicePillTextActive,
                      ]}
                    >
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {newServantForm.serviceId ? (
                <>
                  <Text style={styles.inputLabel}>اختر الفصل</Text>
                  <View style={styles.pillSelectorRow}>
                    {availableClassesForAdd.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.choicePill,
                          newServantForm.classId === String(c.id) && styles.choicePillActive,
                        ]}
                        onPress={() => setNewServantForm((p) => ({ ...p, classId: String(c.id) }))}
                      >
                        <Text
                          style={[
                            styles.choicePillText,
                            newServantForm.classId === String(c.id) && styles.choicePillTextActive,
                          ]}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : null}
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddServantModal(false)}
              >
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                disabled={submitting}
                onPress={handleCreateServant}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>حفظ وتسكين</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2: ASSIGN SERVICE LEADER ================= */}
      <Modal visible={showAssignLeaderModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              تعيين أمين خدمة - {selectedServiceForLeader?.name}
            </Text>

            <Text style={styles.inputLabel}>الصفة / الدور الإداري</Text>
            <View style={styles.pillSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.choicePill,
                  assignLeaderForm.leaderRole === 'service_leader' && styles.choicePillActive,
                ]}
                onPress={() =>
                  setAssignLeaderForm((p) => ({ ...p, leaderRole: 'service_leader' }))
                }
              >
                <Text
                  style={[
                    styles.choicePillText,
                    assignLeaderForm.leaderRole === 'service_leader' && styles.choicePillTextActive,
                  ]}
                >
                  أمين الخدمة
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.choicePill,
                  assignLeaderForm.leaderRole === 'assistant_service_leader' && styles.choicePillActive,
                ]}
                onPress={() =>
                  setAssignLeaderForm((p) => ({ ...p, leaderRole: 'assistant_service_leader' }))
                }
              >
                <Text
                  style={[
                    styles.choicePillText,
                    assignLeaderForm.leaderRole === 'assistant_service_leader' && styles.choicePillTextActive,
                  ]}
                >
                  الأمين المساعد
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>ابحث عن الخادم بالاسم أو الهاتف</Text>
            <TextInput
              style={styles.input}
              placeholder="اكتب اسم الخادم للبحث..."
              value={assignLeaderForm.searchQuery}
              onChangeText={handleSearchMembers}
            />

            {searchingMembers ? <ActivityIndicator size="small" color={NAVY} /> : null}

            <ScrollView style={{ maxHeight: 180, marginVertical: 6 }}>
              {searchedMembers.map((m) => (
                <TouchableOpacity
                  key={m.memberId || m.id}
                  style={[
                    styles.memberSearchItem,
                    assignLeaderForm.churchMemberId === String(m.memberId || m.id) && styles.memberSearchItemActive,
                  ]}
                  onPress={() =>
                    setAssignLeaderForm((p) => ({ ...p, churchMemberId: String(m.memberId || m.id) }))
                  }
                >
                  <Text style={styles.memberSearchName}>{m.fullName}</Text>
                  <Text style={styles.memberSearchPhone}>{m.phone || m.username}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowAssignLeaderModal(false);
                  setSelectedServiceForLeader(null);
                }}
              >
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                disabled={submitting}
                onPress={handleAssignLeader}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>تأكيد التعيين</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 3: REASSIGN SERVANT ================= */}
      <Modal visible={showReassignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              نقل وتعديل تسكين الخادم: {selectedServantForReassign?.fullName}
            </Text>

            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={styles.inputLabel}>انقل إلى الخدمة</Text>
              <View style={styles.pillSelectorRow}>
                {services.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.choicePill,
                      reassignForm.targetServiceId === String(s.id) && styles.choicePillActive,
                    ]}
                    onPress={() => handleServiceChangeForReassign(String(s.id))}
                  >
                    <Text
                      style={[
                        styles.choicePillText,
                        reassignForm.targetServiceId === String(s.id) && styles.choicePillTextActive,
                      ]}
                    >
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {reassignForm.targetServiceId ? (
                <>
                  <Text style={styles.inputLabel}>الفصل المستهدف</Text>
                  <View style={styles.pillSelectorRow}>
                    {availableClassesForReassign.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.choicePill,
                          reassignForm.targetClassId === String(c.id) && styles.choicePillActive,
                        ]}
                        onPress={() => setReassignForm((p) => ({ ...p, targetClassId: String(c.id) }))}
                      >
                        <Text
                          style={[
                            styles.choicePillText,
                            reassignForm.targetClassId === String(c.id) && styles.choicePillTextActive,
                          ]}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : null}

              <Text style={styles.inputLabel}>الدور بالفصل</Text>
              <View style={styles.pillSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.choicePill,
                    reassignForm.leaderRole === 'servant' && styles.choicePillActive,
                  ]}
                  onPress={() => setReassignForm((p) => ({ ...p, leaderRole: 'servant' }))}
                >
                  <Text
                    style={[
                      styles.choicePillText,
                      reassignForm.leaderRole === 'servant' && styles.choicePillTextActive,
                    ]}
                  >
                    خادم
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.choicePill,
                    reassignForm.leaderRole === 'class_leader' && styles.choicePillActive,
                  ]}
                  onPress={() => setReassignForm((p) => ({ ...p, leaderRole: 'class_leader' }))}
                >
                  <Text
                    style={[
                      styles.choicePillText,
                      reassignForm.leaderRole === 'class_leader' && styles.choicePillTextActive,
                    ]}
                  >
                    أمين فصل
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowReassignModal(false);
                  setSelectedServantForReassign(null);
                }}
              >
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                disabled={submitting}
                onPress={handleReassignServant}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>حفظ النقل</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CREAM },
  headerContext: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  sectorTitle: { ...typography.cardTitle, color: '#ffffff', fontWeight: '700', flex: 1 },
  addBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: NAVY },
  tabText: { fontSize: 14, color: MUTED, fontWeight: '600' },
  tabTextActive: { color: NAVY, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 40 },
  servicesList: { gap: 12 },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eceae4',
    ...shadows.card,
    marginBottom: 12,
  },
  serviceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  serviceNameWrap: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: '700', color: NAVY, marginBottom: 2 },
  serviceDesc: { fontSize: 12, color: MUTED },
  assignLeaderBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  assignLeaderBtnText: { color: '#1d4ed8', fontSize: 12, fontWeight: '600' },
  leadersBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leaderBadge: {
    fontSize: 10,
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '700',
  },
  leaderName: { fontSize: 13, fontWeight: '600', color: CHARCOAL, flex: 1 },
  leaderPhone: { fontSize: 12, color: MUTED },
  serviceStatsRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  statPill: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  statValue: { fontSize: 15, fontWeight: '800', color: NAVY },
  statLabel: { fontSize: 11, color: MUTED, marginTop: 1 },
  filterScroll: { marginBottom: 12 },
  filterChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterChipText: { fontSize: 12, color: CHARCOAL, fontWeight: '600' },
  filterChipTextActive: { color: '#ffffff' },
  emptyContainer: { padding: 30, alignItems: 'center' },
  emptyText: { color: MUTED, fontSize: 14 },
  servantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eceae4',
    marginBottom: 10,
    ...shadows.card,
  },
  servantInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 18, color: NAVY, fontWeight: '700' },
  servantDetails: { flex: 1 },
  servantName: { fontSize: 15, fontWeight: '700', color: CHARCOAL },
  servantPhone: { fontSize: 12, color: MUTED, marginTop: 1 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  serviceBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  serviceBadgeText: { fontSize: 11, color: '#1d4ed8', fontWeight: '600' },
  classBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  classBadgeText: { fontSize: 11, color: '#374151', fontWeight: '600' },
  servantActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8 },
  reassignBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  reassignBtnText: { fontSize: 12, color: '#334155', fontWeight: '700' },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    ...shadows.card,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: NAVY, marginBottom: 14, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: CHARCOAL, marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: CHARCOAL,
  },
  pillSelectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  choicePill: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  choicePillActive: { backgroundColor: NAVY, borderColor: NAVY },
  choicePillText: { fontSize: 12, color: CHARCOAL, fontWeight: '600' },
  choicePillTextActive: { color: '#ffffff' },
  memberSearchItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    borderRadius: 6,
  },
  memberSearchItemActive: { backgroundColor: '#e0e7ff' },
  memberSearchName: { fontSize: 14, fontWeight: '700', color: CHARCOAL },
  memberSearchPhone: { fontSize: 12, color: MUTED },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, backgroundColor: '#f3f4f6' },
  cancelBtnText: { color: CHARCOAL, fontWeight: '600', fontSize: 13 },
  submitBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8, backgroundColor: NAVY },
  submitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
});
