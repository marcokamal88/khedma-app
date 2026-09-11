import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { attendanceApi } from "../../api/attendance.api";
import { churchApi } from "../../api/church.api";
import apiClient from "../../api/client";
import { useLocale } from "../../hooks/useLocale";
import { typography, shadows } from "../../theme";
import CalendarPicker from "../../components/CalendarPicker";
import AppHeader from "../../components/AppHeader";

const NAVY = "#192f5f";
const GOLD = "#d4a843";
const CREAM = "#f7f4ed";
const OFF_WHITE = "#fcfbf8";
const BORDER = "#eceae4";
const CHARCOAL = "#1c1c1c";
const MUTED = "#5f5f5d";
const GREEN = "#2e7d32";
const YELLOW = "#e6a817";
const RED = "#c62828";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface Student {
  id: string;
  fullName: string;
  avatarUrl?: string;
  taioBalance?: number;
}

interface SessionRecord {
  id: number;
  churchMemberId: number;
  status: AttendanceStatus;
}

interface Session {
  id: number;
  serviceId: number;
  classId: number;
  sessionType: string;
  sessionDate: string;
  notes?: string;
  records?: SessionRecord[];
}

interface StageGroupInfo {
  id: number;
  name: string;
}

interface ClassInfo {
  id: number;
  name: string;
  stageGroup?: StageGroupInfo;
}

interface ServiceInfo {
  id: number;
  name: string;
}

interface MyClassAssignment {
  id: number;
  serviceYearId: string;
  class: ClassInfo;
  service: ServiceInfo;
}

export default function AttendanceScreen() {
  const { t } = useLocale();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classAssignment, setClassAssignment] =
    useState<MyClassAssignment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [memberStatuses, setMemberStatuses] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [sessionRecords, setSessionRecords] = useState<Record<string, number>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [noClass, setNoClass] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<"search" | "register">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingStudent, setSavingStudent] = useState(false);
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<
    "newBirthDate" | "editBirthDate" | null
  >(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newGender, setNewGender] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newBirthDate, setNewBirthDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setNoClass(false);
    try {
      const assignmentRes: any = await churchApi.getMyClass();
      const assignment = assignmentRes?.data || assignmentRes;
      setClassAssignment(assignment);
      const classId = String(assignment.class.id);

      const [studentsRes, sessionsRes] = await Promise.all([
        churchApi.getClassStudents(classId),
        attendanceApi.getSessions({ classId }),
      ]);

      setStudents(studentsRes?.data || []);
      setSessions(sessionsRes?.data || []);
    } catch (err: any) {
      if (
        err?.statusCode === 404 ||
        err?.message?.includes("No class assignment")
      ) {
        setNoClass(true);
      }
      setStudents([]);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const searchMembers = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res: any = await churchApi.searchMembers(searchQuery.trim());
      setSearchResults(res?.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const enrollMember = useCallback(
    async (churchMemberId: string) => {
      if (!classAssignment) return;
      setEnrolling(true);
      try {
        await churchApi.enrollMember({
          churchMemberId,
          serviceId: String(classAssignment.service.id),
          classId: String(classAssignment.class.id),
          serviceYearId: String(classAssignment.serviceYearId),
        });
        Alert.alert(t("app.success"), t("attendance.addedSuccess"));
        setShowAddModal(false);
        loadData();
      } catch (err: any) {
        Alert.alert(t("app.error"), err?.message || t("app.retry"));
      } finally {
        setEnrolling(false);
      }
    },
    [classAssignment, loadData, t],
  );

  const registerStudent = useCallback(async () => {
    if (!newName.trim() || !classAssignment) return;
    setEnrolling(true);
    try {
      await churchApi.registerMember({
        fullName: newName.trim(),
        phone: newPhone.trim() || undefined,
        password: newPassword || "changeme123",
        serviceId: String(classAssignment.service.id),
        classId: String(classAssignment.class.id),
        serviceYearId: String(classAssignment.serviceYearId),
        address: newAddress.trim() || undefined,
        birthDate: newBirthDate.trim() || undefined,
        notes: newNotes.trim() || undefined,
        gender: (newGender as any) || undefined,
      } as any);
      Alert.alert(t("app.success"), t("attendance.addedSuccess"));
      setShowAddModal(false);
      setNewName("");
      setNewPhone("");
      setNewGender("");
      setNewAddress("");
      setNewBirthDate("");
      setNewNotes("");
      setNewPassword("");
      loadData();
    } catch (err: any) {
      Alert.alert(t("app.error"), err?.message || t("app.retry"));
    } finally {
      setEnrolling(false);
    }
  }, [
    newName,
    newPhone,
    newGender,
    newAddress,
    newBirthDate,
    newNotes,
    newPassword,
    classAssignment,
    loadData,
    t,
  ]);

  const loadSessionDetail = useCallback(
    async (sessionId: number) => {
      setLoadingDetail(true);
      try {
        const data: any = await attendanceApi.getSession(String(sessionId));
        const session = data?.data || data;
        setSelectedSession(session);

        const statuses: Record<string, AttendanceStatus> = {};
        const records: Record<string, number> = {};
        (session?.records || []).forEach((r: SessionRecord) => {
          statuses[r.churchMemberId] = r.status;
          records[r.churchMemberId] = r.id;
        });
        setMemberStatuses(statuses);
        setSessionRecords(records);
      } catch {
        Alert.alert(t("app.error"), t("app.retry"));
      } finally {
        setLoadingDetail(false);
      }
    },
    [t],
  );

  const openSession = useCallback(
    (session: Session) => {
      loadSessionDetail(session.id);
    },
    [loadSessionDetail],
  );

  const createNewSession = useCallback(async () => {
    if (!classAssignment) return;
    try {
      const data: any = await attendanceApi.createSession({
        serviceId: String(classAssignment.service.id),
        classId: String(classAssignment.class.id),
        serviceYearId: String(classAssignment.serviceYearId),
        sessionDate: new Date().toISOString().split("T")[0],
        sessionType: "service",
      });
      const newSession = data?.data || data;
      if (newSession?.id) {
        setSelectedSession(newSession);
        setMemberStatuses({});
        setSessionRecords({});
        loadData();
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("already exists")) {
        Alert.alert(
          t("attendance.duplicateTitle"),
          t("attendance.duplicateMsg"),
        );
      } else {
        Alert.alert(t("app.error"), t("app.retry"));
      }
    }
  }, [classAssignment, loadData, t]);

  const openStudentModal = useCallback((student: any) => {
    setEditingStudent(student);
    setEditName(student.fullName);
    setEditPhone((student as any).phone || "");
    setEditGender((student as any).gender || "");
    setEditAddress((student as any).address || "");
    setEditBirthDate((student as any).birthDate || "");
    setEditNotes((student as any).notes || "");
    setShowStudentModal(true);
  }, []);

  const saveStudent = useCallback(async () => {
    if (!editingStudent) return;
    setSavingStudent(true);
    try {
      await apiClient.patch(`/members/${editingStudent.id}`, {
        fullName: editName.trim() || undefined,
        phone: editPhone.trim() || undefined,
        gender: editGender || undefined,
        address: editAddress.trim() || undefined,
        birthDate: editBirthDate.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      Alert.alert(t("app.success"), "");
      setShowStudentModal(false);
      loadData();
    } catch (err: any) {
      Alert.alert(t("app.error"), err?.message || t("app.retry"));
    } finally {
      setSavingStudent(false);
    }
  }, [
    editingStudent,
    editName,
    editPhone,
    editGender,
    editAddress,
    editBirthDate,
    editNotes,
    loadData,
    t,
  ]);

  const toggleStatus = useCallback((memberId: string) => {
    setMemberStatuses((prev) => {
      const current = prev[memberId];
      let next: AttendanceStatus;
      if (!current || current === "absent") next = "present";
      else if (current === "present") next = "late";
      else if (current === "late") next = "excused";
      else next = "absent";
      return { ...prev, [memberId]: next };
    });
  }, []);

  const saveAttendance = useCallback(async () => {
    if (!selectedSession?.id) return;
    setSaving(true);
    try {
      const records = Object.entries(memberStatuses).map(
        ([memberId, status]) => ({
          churchMemberId: memberId,
          status,
        }),
      );
      await attendanceApi.recordAttendance(String(selectedSession.id), records);
      Alert.alert(t("app.success"), "");
      loadData();
      setSelectedSession(null);
    } catch {
      Alert.alert(t("app.error"), t("app.retry"));
    } finally {
      setSaving(false);
    }
  }, [selectedSession, memberStatuses, loadData, t]);

  const getMemberInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const getStatusIcon = (status?: AttendanceStatus) => {
    switch (status) {
      case "present":
        return { icon: "\u2714", bg: GREEN, color: "#ffffff", fontSize: 16 };
      case "late":
        return { icon: "\u25F7", bg: YELLOW, color: "#ffffff", fontSize: 30 };
      case "absent":
        return { icon: "\u2718", bg: RED, color: "#ffffff", fontSize: 16 };
      case "excused":
        return { icon: "\u2714", bg: "#1565c0", color: "#ffffff", fontSize: 16 };
      default:
        return { icon: "\u2718", bg: "#e0e0e0", color: MUTED, fontSize: 16 };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (noClass) {
    return (
      <View style={styles.root}>
        <AppHeader greetingText={t("attendance.title")} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{"\u2637"}</Text>
          <Text style={styles.emptyText}>{t("attendance.noClass")}</Text>
        </View>
      </View>
    );
  }

  if (loadingDetail) {
    return (
      <View style={styles.root}>
        <AppHeader greetingText={""} />
        <View style={styles.detailLoadingContainer}>
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      </View>
    );
  }

  if (selectedSession) {
    const statusButtons: AttendanceStatus[] = ["absent", "late", "present"];
    return (
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <AppHeader greetingText={t("attendance.title")}>
            <View style={styles.sessionInfoCard}>
              <View style={styles.sessionInfoRow}>
                <View style={styles.sessionInfoIconWrap}>
                  <Text style={styles.sessionInfoIcon}>{"\u25F7"}</Text>
                </View>
                <View style={styles.sessionInfoTextWrap}>
                  <Text style={styles.sessionInfoTitle}>
                    {classAssignment?.service?.name} -{" "}
                    {classAssignment?.class?.stageGroup?.name}
                  </Text>
                  <Text style={styles.sessionInfoMeta}>
                    {selectedSession.sessionDate}
                  </Text>
                </View>
              </View>
            </View>
          </AppHeader>

          <View style={styles.contentSection}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionHeaderTitle}>
                {t("attendance.title")}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedSession(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.sessionHeaderLink}>{"\u2715"}</Text>
              </TouchableOpacity>
            </View>

            {students.map((student) => {
              const status = memberStatuses[student.id];
              const { icon, bg, color } = getStatusIcon(status);
              return (
                <View key={student.id} style={styles.memberRow}>
                  <View style={styles.memberRowRight}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {getMemberInitials(student.fullName)}
                      </Text>
                    </View>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {student.fullName}
                    </Text>
                  </View>
                  <View style={styles.statusButtons}>
                    {statusButtons.map((s) => {
                      const isActive = status === s;
                      const {
                        icon: sIcon,
                        bg: sBg,
                        color: sColor,
                        fontSize: sSize,
                      } = getStatusIcon(s);
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.statusBtn,
                            isActive && { backgroundColor: sBg },
                          ]}
                          onPress={() => {
                            if (isActive) {
                              setMemberStatuses((prev) => ({
                                ...prev,
                                [student.id]: "absent",
                              }));
                            } else {
                              setMemberStatuses((prev) => ({
                                ...prev,
                                [student.id]: s,
                              }));
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.statusBtnIcon,
                              
                              isActive && { color: sColor },
                              { fontSize: sSize },
                              
                              s === "late" && { transform: [{ scale: 1.2 }],marginTop :-8 },
                            ]}
                          >
                            {sIcon}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {students.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>{"\u2637"}</Text>
                <Text style={styles.emptyText}>{t("app.noData")}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={saveAttendance}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Text style={styles.saveBtnText}>{t("app.save")}</Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  const currentWeekSessions = sessions.filter((s) => {
    const d = new Date(s.sessionDate);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
  });

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#192f5f']} tintColor="#192f5f" />}
      >
        <AppHeader greetingText={t("attendance.title")}>
          <View style={styles.classInfoCard}>
            <View style={styles.classInfoRow}>
              <View style={styles.classInfoIconWrap}>
                <Text style={styles.classInfoIcon}>{"\uD83C\uDF93"}</Text>
              </View>
              <View style={styles.classInfoTextWrap}>
                <Text style={styles.classInfoTitle}>
                  {classAssignment?.service?.name}
                </Text>
                <Text style={styles.classInfoMeta}>
                  {classAssignment?.class?.stageGroup?.name} -{" "}
                  {classAssignment?.class?.name}
                </Text>
              </View>
            </View>
          </View>
        </AppHeader>

        <View style={styles.contentSection}>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{students.length}</Text>
              <Text style={styles.metricLabel}>
                {t("attendance.totalStudents")}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{sessions.length}</Text>
              <Text style={styles.metricLabel}>
                {t("attendance.totalSessions")}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {currentWeekSessions.length}
              </Text>
              <Text style={styles.metricLabel}>{t("attendance.thisWeek")}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.createCard}
            onPress={createNewSession}
            activeOpacity={0.7}
          >
            <View style={styles.createCardLeft}>
              <View style={styles.createCardIconWrap}>
                <Text style={styles.createCardIcon}>{"\u2795"}</Text>
              </View>
              <View>
                <Text style={styles.createCardTitle}>
                  {t("attendance.createSession")}
                </Text>
                <Text style={styles.createCardSubtitle}>
                  {classAssignment?.class?.name}
                </Text>
              </View>
            </View>
            <Text style={styles.createCardArrow}>{"\u276E"}</Text>
          </TouchableOpacity>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t("attendance.students")}
              </Text>
              <View style={styles.sectionHeaderRight}>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => setShowAddModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.sectionCount}>{students.length}</Text>
              </View>
            </View>
            {students.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>{"\u2637"}</Text>
                <Text style={styles.emptyText}>{t("app.noData")}</Text>
              </View>
            ) : (
              <>
                {students.slice(0, 5).map((student) => (
                  <TouchableOpacity
                    key={student.id}
                    style={styles.studentRow}
                    onPress={() => openStudentModal(student)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.studentRowRight}>
                      <View style={styles.studentAvatar}>
                        <Text style={styles.studentAvatarText}>
                          {getMemberInitials(student.fullName)}
                        </Text>
                      </View>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {student.fullName}
                      </Text>
                      <View style={styles.taioBadge}>
                        <Text style={styles.taioBadgeText}>
                          {student.taioBalance ?? 0}
                        </Text>
                        <Text style={styles.taioBadgeLabel}>
                          {t("taio.points")}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.editIcon}>{"\u270E"}</Text>
                  </TouchableOpacity>
                ))}
                {students.length > 5 && (
                  <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={() => setShowAllStudents(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.seeAllText}>
                      {t("attendance.seeAll")} ({students.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("attendance.recent")}</Text>
            </View>

            {sessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>{"\u2637"}</Text>
                <Text style={styles.emptyText}>{t("app.noData")}</Text>
              </View>
            ) : (
              <>
                {sessions.slice(0, 5).map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionRow}
                  onPress={() => openSession(session)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionRowRight}>
                    <View style={styles.sessionIconWrap}>
                      <Text style={styles.sessionIcon}>{"\u2637"}</Text>
                    </View>
                    <View style={styles.sessionTextWrap}>
                      <Text style={styles.sessionTitle} numberOfLines={1}>
                        {session.sessionDate}
                      </Text>
                      <Text style={styles.sessionMeta} numberOfLines={1}>
                        {t("attendance.records")}
                        {session.records?.length || 0}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.attendedPill}>
                    <Text style={styles.attendedPillText}>
                      {session.records?.filter(r => r.status === 'present').length || 0}
                    </Text>
                  </View>
                </TouchableOpacity>
                ))}
                {sessions.length > 5 && (
                  <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={() => setShowAllSessions(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.seeAllText}>
                      {t("attendance.seeAll")} ({sessions.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.sheetWrapper}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalClose}>{"\u2715"}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {t("attendance.addStudent")}
              </Text>
              <View style={{ width: 30 }} />
            </View>

            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[
                  styles.modeTab,
                  addMode === "search" && styles.modeTabActive,
                ]}
                onPress={() => setAddMode("search")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    addMode === "search" && styles.modeTabTextActive,
                  ]}
                >
                  {t("attendance.search")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeTab,
                  addMode === "register" && styles.modeTabActive,
                ]}
                onPress={() => setAddMode("register")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    addMode === "register" && styles.modeTabTextActive,
                  ]}
                >
                  {t("attendance.register")}
                </Text>
              </TouchableOpacity>
            </View>

            {addMode === "search" ? (
              <View style={styles.modalBody}>
                <TextInput
                  style={styles.input}
                  placeholder={t("attendance.searchPlaceholder")}
                  placeholderTextColor={MUTED}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={searchMembers}
                  returnKeyType="search"
                />
                <TouchableOpacity
                  style={styles.searchBtn}
                  onPress={searchMembers}
                  disabled={searching}
                  activeOpacity={0.7}
                >
                  <Text style={styles.searchBtnText}>
                    {searching ? t("app.loading") : t("attendance.search")}
                  </Text>
                </TouchableOpacity>

                <ScrollView
                  style={styles.searchResultsList}
                  keyboardShouldPersistTaps="handled"
                >
                  {searchResults.map((member: any) => (
                    <TouchableOpacity
                      key={member.id}
                      style={styles.searchResultRow}
                      onPress={() => enrollMember(member.id)}
                      disabled={enrolling}
                      activeOpacity={0.7}
                    >
                      <View style={styles.searchResultAvatar}>
                        <Text style={styles.searchResultAvatarText}>
                          {member.fullName
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) || "?"}
                        </Text>
                      </View>
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultName}>
                          {member.fullName}
                        </Text>
                        <Text style={styles.searchResultMeta}>
                          {member.email || member.phone}
                        </Text>
                      </View>
                      <Text style={styles.enrollIcon}>
                        {enrolling ? "..." : "+"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {searchResults.length === 0 &&
                    searchQuery.trim() &&
                    !searching && (
                      <Text style={styles.noResults}>{t("app.noData")}</Text>
                    )}
                </ScrollView>
              </View>
            ) : (
              <View style={{ gap: 0 }}>
                <TextInput
                  style={styles.input}
                  placeholder={t("auth.fullName")}
                  placeholderTextColor={MUTED}
                  value={newName}
                  onChangeText={setNewName}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t("auth.phonePlaceholder")}
                  placeholderTextColor={MUTED}
                  value={newPhone}
                  onChangeText={setNewPhone}
                  keyboardType="phone-pad"
                />
                <View style={styles.genderRow}>
                  <TouchableOpacity style={[styles.genderBtn, newGender === 'male' && styles.genderActive]} onPress={() => setNewGender('male')} activeOpacity={0.7}><Text style={[styles.genderText, newGender === 'male' && styles.genderTextActive]}>ذكر</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.genderBtn, newGender === 'female' && styles.genderActive]} onPress={() => setNewGender('female')} activeOpacity={0.7}><Text style={[styles.genderText, newGender === 'female' && styles.genderTextActive]}>أنثى</Text></TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={t("attendance.addressPlaceholder")}
                  placeholderTextColor={MUTED}
                  value={newAddress}
                  onChangeText={setNewAddress}
                />
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => {
                    setCalendarTarget("newBirthDate");
                    setShowCalendar(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dateInputText,
                      !newBirthDate && styles.dateInputPlaceholder,
                    ]}
                  >
                    {newBirthDate || t("attendance.birthDatePlaceholder")}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={t("attendance.notesPlaceholder")}
                  placeholderTextColor={MUTED}
                  value={newNotes}
                  onChangeText={setNewNotes}
                  multiline
                  numberOfLines={3}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t("attendance.passwordPlaceholder")}
                  placeholderTextColor={MUTED}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={styles.searchBtn}
                  onPress={registerStudent}
                  disabled={enrolling}
                  activeOpacity={0.7}
                >
                  <Text style={styles.searchBtnText}>
                    {enrolling ? t("app.loading") : t("attendance.register")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showStudentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStudentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.sheetWrapper}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowStudentModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalClose}>{"\u2715"}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {t("attendance.editStudent")}
              </Text>
              <View style={{ width: 30 }} />
            </View>
            <View style={{ gap: 0 }}>
              <TextInput
                style={styles.input}
                placeholder={t("auth.fullName")}
                placeholderTextColor={MUTED}
                value={editName}
                onChangeText={setEditName}
              />
              <TextInput
                style={styles.input}
                placeholder={t("auth.phonePlaceholder")}
                placeholderTextColor={MUTED}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />
              <View style={styles.genderRow}>
                <TouchableOpacity style={[styles.genderBtn, editGender === 'male' && styles.genderActive]} onPress={() => setEditGender('male')} activeOpacity={0.7}><Text style={[styles.genderText, editGender === 'male' && styles.genderTextActive]}>ذكر</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.genderBtn, editGender === 'female' && styles.genderActive]} onPress={() => setEditGender('female')} activeOpacity={0.7}><Text style={[styles.genderText, editGender === 'female' && styles.genderTextActive]}>أنثى</Text></TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder={t("attendance.addressPlaceholder")}
                placeholderTextColor={MUTED}
                value={editAddress}
                onChangeText={setEditAddress}
              />
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  setCalendarTarget("editBirthDate");
                  setShowCalendar(true);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dateInputText,
                    !editBirthDate && styles.dateInputPlaceholder,
                  ]}
                >
                  {editBirthDate || t("attendance.birthDatePlaceholder")}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t("attendance.notesPlaceholder")}
                placeholderTextColor={MUTED}
                value={editNotes}
                onChangeText={setEditNotes}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={saveStudent}
                disabled={savingStudent}
                activeOpacity={0.7}
              >
                <Text style={styles.searchBtnText}>
                  {savingStudent ? t("app.loading") : t("app.save")}
                </Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showAllStudents}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllStudents(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowAllStudents(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalClose}>{"\u2715"}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {t("attendance.students")} ({students.length})
              </Text>
              <View style={{ width: 30 }} />
            </View>
            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              {students.map((student) => (
                <TouchableOpacity
                  key={student.id}
                  style={styles.studentRow}
                  onPress={() => {
                    setShowAllStudents(false);
                    openStudentModal(student);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.studentRowRight}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentAvatarText}>
                        {getMemberInitials(student.fullName)}
                      </Text>
                    </View>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {student.fullName}
                    </Text>
                    <View style={styles.taioBadge}>
                      <Text style={styles.taioBadgeText}>
                        {student.taioBalance ?? 0}
                      </Text>
                      <Text style={styles.taioBadgeLabel}>
                        {t("taio.points")}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.editIcon}>{"\u270E"}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showAllSessions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllSessions(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowAllSessions(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalClose}>{"\u2715"}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {t("attendance.recent")} ({sessions.length})
              </Text>
              <View style={{ width: 30 }} />
            </View>
            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              {sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionRow}
                  onPress={() => {
                    setShowAllSessions(false);
                    openSession(session);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionRowRight}>
                    <View style={styles.sessionIconWrap}>
                      <Text style={styles.sessionIcon}>{"\u2637"}</Text>
                    </View>
                    <View style={styles.sessionTextWrap}>
                      <Text style={styles.sessionTitle} numberOfLines={1}>
                        {session.sessionDate}
                      </Text>
                      <Text style={styles.sessionMeta} numberOfLines={1}>
                        {t("attendance.records")}
                        {session.records?.length || 0}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.attendedPill}>
                    <Text style={styles.attendedPillText}>
                      {session.records?.filter(r => r.status === 'present').length || 0}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CalendarPicker
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onSelect={(dateStr) => {
          if (calendarTarget === "newBirthDate") setNewBirthDate(dateStr);
          if (calendarTarget === "editBirthDate") setEditBirthDate(dateStr);
        }}
        initialDate={
          calendarTarget === "editBirthDate"
            ? editBirthDate || undefined
            : newBirthDate || undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: NAVY,
  },
  detailLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CREAM,
  },
  scroll: { flex: 1 },

  classInfoCard: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    padding: 14,
  },
  classInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  classInfoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  classInfoIcon: { fontSize: 18 },
  classInfoTextWrap: { flex: 1 },
  classInfoTitle: {
    ...typography.cardTitle,
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "left",
    marginLeft: 16,
  },
  classInfoMeta: {
    ...typography.caption,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
    textAlign: "left",
    marginLeft: 16,
  },

  sessionInfoCard: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    padding: 14,
    marginTop: 16,
  },
  sessionInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionInfoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  sessionInfoIcon: { fontSize: 18, color: "#ffffff" },
  sessionInfoTextWrap: { flex: 1 },
  sessionInfoTitle: {
    ...typography.cardTitle,
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "right",
  },
  sessionInfoMeta: {
    ...typography.caption,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
    textAlign: "right",
  },

  contentSection: { paddingHorizontal: 16, paddingTop: 16 },

  metricsRow: {
    flexDirection: "row-reverse",
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 16,
    alignItems: "center",
    ...shadows.card,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  metricValue: {
    ...typography.sectionHeading,
    color: NAVY,
    fontWeight: "700",
    marginBottom: 4,
  },
  metricLabel: {
    ...typography.caption,
    color: MUTED,
    fontSize: 10,
  },

  createCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 20,
    ...shadows.card,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  createCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  createCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  createCardIcon: { fontSize: 20, color: CHARCOAL },
  createCardTitle: {
    ...typography.cardTitle,
    color: CHARCOAL,
    fontWeight: "700",
  },
  createCardSubtitle: { ...typography.caption, color: MUTED, marginTop: 2 },
  createCardArrow: { fontSize: 16, color: MUTED },

  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sessionHeaderTitle: { ...typography.cardTitle, color: CHARCOAL },
  sessionHeaderLink: {
    ...typography.buttonSmall,
    color: NAVY,
    fontWeight: "600",
    fontSize: 18,
  },

  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { ...typography.cardTitle, color: CHARCOAL },
  sectionCount: {
    ...typography.caption,
    color: MUTED,
    backgroundColor: OFF_WHITE,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyIcon: { fontSize: 40, color: MUTED, marginBottom: 8, opacity: 0.4 },
  emptyText: { ...typography.body, color: MUTED },

  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: OFF_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 8,
  },
  studentRowRight: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  studentAvatarText: {
    ...typography.subHeading,
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  studentName: {
    ...typography.body,
    color: CHARCOAL,
    fontWeight: "600",
    textAlign: "left",
    flex: 1,
  },
  taioBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F5EE",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  taioBadgeText: {
    ...typography.caption,
    color: GREEN,
    fontWeight: "700",
    fontSize: 12,
  },
  taioBadgeLabel: {
    ...typography.caption,
    color: GREEN,
    fontSize: 10,
    marginLeft: 2,
  },
  editIcon: { fontSize: 16, color: MUTED, marginLeft: 8 },

  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: OFF_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 8,
  },
  sessionRowRight: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sessionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sessionIcon: { fontSize: 16, color: "#ffffff" },
  sessionTextWrap: { flex: 1 },
  sessionTitle: {
    ...typography.body,
    color: CHARCOAL,
    fontWeight: "600",
    textAlign: "left",
  },
  sessionMeta: {
    ...typography.caption,
    color: MUTED,
    marginTop: 2,
    textAlign: "left",
  },
  attendedPill: {
    backgroundColor: "#e8f5e9",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginLeft: 8,
    minWidth: 40,
    alignItems: "center",
  },
  attendedPillText: {
    ...typography.caption,
    color: "#2e7d32",
    fontWeight: "700",
    fontSize: 13,
  },

  memberRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: OFF_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 8,
  },
  memberRowRight: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  memberAvatarText: {
    ...typography.subHeading,
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  memberName: {
    ...typography.body,
    color: CHARCOAL,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },

  statusButtons: {
    flexDirection: "row-reverse",
    gap: 6,
  },
  statusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBtnIcon: { fontSize: 16, color: MUTED },

  saveBtn: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.cardTitle, color: CHARCOAL, fontWeight: "700" },

  sectionHeaderRight: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 20,
    color: CHARCOAL,
    fontWeight: "700",
    lineHeight: 22,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetWrapper: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "85%",
    maxHeight: "85%",
    width: "100%",
    overflow: "hidden",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 32,
    flexShrink: 1,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalClose: { fontSize: 20, color: MUTED },
  modalTitle: { ...typography.cardTitle, color: CHARCOAL, fontWeight: "700" },
  modeTabs: {
    flexDirection: "row-reverse",
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: OFF_WHITE,
    borderRadius: 12,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: "#ffffff",
    ...shadows.card,
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  modeTabText: { ...typography.body, color: MUTED },
  modeTabTextActive: { color: NAVY, fontWeight: "600" },
  modalBody: { paddingHorizontal: 20, paddingTop: 16 },
  input: {
    backgroundColor: OFF_WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: CHARCOAL,
    textAlign: "right",
    marginBottom: 12,
  },
  searchBtn: {
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  searchBtnText: {
    ...typography.cardTitle,
    color: "#ffffff",
    fontWeight: "600",
  },
  textArea: { height: 80, textAlignVertical: "top" },
  searchResultsList: { maxHeight: 300 },
  searchResultRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  searchResultAvatarText: {
    ...typography.subHeading,
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  searchResultInfo: { flex: 1 },
  searchResultName: {
    ...typography.body,
    color: CHARCOAL,
    fontWeight: "600",
    textAlign: "right",
  },
  searchResultMeta: {
    ...typography.caption,
    color: MUTED,
    marginTop: 2,
    textAlign: "right",
  },
  enrollIcon: { fontSize: 22, color: GOLD, fontWeight: "700" },
  noResults: {
    ...typography.body,
    color: MUTED,
    textAlign: "center",
    paddingVertical: 20,
  },
  dateInput: {
    backgroundColor: OFF_WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  dateInputText: { fontSize: 16, color: CHARCOAL, textAlign: "right" },
  dateInputPlaceholder: { color: MUTED },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  genderActive: { backgroundColor: NAVY, borderColor: NAVY },
  genderText: { ...typography.buttonSmall, color: MUTED },
  genderTextActive: { color: '#ffffff' },
  seeAllBtn: {
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: OFF_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 4,
  },
  seeAllText: { ...typography.body, color: NAVY, fontWeight: "600" },
});
