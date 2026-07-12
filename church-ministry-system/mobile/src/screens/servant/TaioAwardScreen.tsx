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
} from "react-native";
import { churchApi } from "../../api/church.api";
import { taioApi } from "../../api/taio.api";
import apiClient from "../../api/client";
import { useLocale } from "../../hooks/useLocale";
import { typography, shadows } from "../../theme";
import AppHeader from "../../components/AppHeader";

const NAVY = "#0F1D3A";
const GOLD = "#E3B341";
const CREAM = "#F7F6F2";
const OFF_WHITE = "#fcfbf8";
const BORDER = "#eceae4";
const CHARCOAL = "#1c1c1c";
const MUTED = "#5f5f5d";
const GREEN = "#2E7D32";
const LIGHT_GREEN = "#E6F5EE";

interface Student {
  id: string;
  fullName: string;
  taioBalance?: number;
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

interface ClassAssignment {
  id: number;
  serviceYearId: string;
  class: ClassInfo;
  service: ServiceInfo;
}

export default function TaioAwardScreen() {
  const { t } = useLocale();

  const [loading, setLoading] = useState(true);
  const [classAssignment, setClassAssignment] =
    useState<ClassAssignment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [noClass, setNoClass] = useState(false);
  const [serviceYearId, setServiceYearId] = useState("");

  const [awardModalVisible, setAwardModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [awardPoints, setAwardPoints] = useState("");
  const [awardReason, setAwardReason] = useState("");
  const [awarding, setAwarding] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setNoClass(false);
    try {
      const assignmentRes: any = await churchApi.getMyClass();
      const assignment = assignmentRes?.data || assignmentRes;
      setClassAssignment(assignment);
      const classId = String(assignment.class.id);

      const [studentsRes, syRes] = await Promise.all([
        churchApi.getClassStudents(classId),
        apiClient.get("/service-years/current"),
      ]);

      setStudents(studentsRes?.data || []);
      const year = syRes?.data || syRes;
      if (year?.id) setServiceYearId(year.id);
    } catch (err: any) {
      if (
        err?.statusCode === 404 ||
        err?.message?.includes("No class assignment")
      ) {
        setNoClass(true);
      } else {
        try {
          const syRes: any = await apiClient.get("/service-years/current");
          const year = syRes?.data || syRes;
          if (year?.id) setServiceYearId(year.id);
        } catch {}
      }
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAwardModal = (student: Student) => {
    setSelectedStudent(student);
    setAwardPoints("");
    setAwardReason("");
    setAwardModalVisible(true);
  };

  const submitAward = async () => {
    if (!selectedStudent || !awardPoints.trim()) return;
    const pointsNum = parseInt(awardPoints, 10);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      Alert.alert(
        t("app.error"),
        t("award.points") + " " + t("errors.askPriest"),
      );
      return;
    }
    setAwarding(true);
    try {
      await taioApi.awardPoints({
        churchMemberId: selectedStudent.id,
        points: pointsNum,
        reason: awardReason.trim() || t("award.reason"),
        sourceType: "manual",
        serviceYearId,
      });
      Alert.alert(t("app.success"), t("award.success"));
      setAwardModalVisible(false);
    } catch (err: any) {
      Alert.alert(
        t("app.error"),
        err?.response?.data?.message || err?.message || t("award.failure"),
      );
    } finally {
      setAwarding(false);
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
        <AppHeader greetingText={t("award.title")} />
        <View style={styles.contentSection}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{"\u2606"}</Text>
            <Text style={styles.emptyText}>{t("attendance.noClass")}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader greetingText={t("award.title")}>
          <View style={styles.classInfoCard}>
            <View style={styles.classInfoRow}>
              <View style={styles.classInfoIconWrap}>
                <Text style={styles.classInfoIcon}>{"\u2605"}</Text>
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
          {/* <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{students.length}</Text>
              <Text style={styles.metricLabel}>
                {t("attendance.totalStudents")}
              </Text>
            </View>
          </View> */}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t("attendance.students")}
              </Text>
              <View style={styles.sectionHeaderRight}>
                <Text style={styles.sectionCount}>{students.length}</Text>
              </View>
            </View>

            {students.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>{"\u2637"}</Text>
                <Text style={styles.emptyText}>{t("app.noData")}</Text>
              </View>
            ) : (
              students.map((student) => (
                <View key={student.id} style={styles.memberRow}>
                  <View style={styles.memberRowRight}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {student.fullName}
                    </Text>
                    <View style={styles.balanceBadge}>
                      <Text style={styles.balanceBadgeValue}>
                        {student.taioBalance ?? 0}
                      </Text>
                      <Text style={styles.balanceBadgeLabel}>{t("")}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.awardBtn}
                    onPress={() => openAwardModal(student)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.awardBtnText}>{t("award.give")}</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            <View style={{ height: 24 }} />
          </View>
        </View>
      </ScrollView>

      <Modal visible={awardModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t("award.awardTo")} {selectedStudent?.fullName}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("award.points")}</Text>
              <TextInput
                style={styles.input}
                value={awardPoints}
                onChangeText={setAwardPoints}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={MUTED}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("award.reason")}</Text>
              <TextInput
                style={[styles.input, styles.reasonInput]}
                value={awardReason}
                onChangeText={setAwardReason}
                placeholder={t("award.reason")}
                placeholderTextColor={MUTED}
                multiline
                textAlign="right"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAwardModalVisible(false)}
                activeOpacity={0.7}
                disabled={awarding}
              >
                <Text style={styles.modalCancelText}>{t("app.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  awarding && styles.modalSubmitBtnDisabled,
                ]}
                onPress={submitAward}
                activeOpacity={0.7}
                disabled={awarding}
              >
                {awarding ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitText}>
                    {t("award.button")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  scroll: { flex: 1 },

  classInfoCard: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    padding: 14,
  },
  classInfoRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  classInfoIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  classInfoIcon: { fontSize: 24, color: GOLD },
  classInfoTextWrap: { flex: 1 },
  classInfoTitle: {
    ...typography.cardTitle,
    color: "#ffffff",
    fontWeight: "700",
  },
  classInfoMeta: {
    ...typography.caption,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },

  contentSection: { paddingHorizontal: 16, paddingTop: 16 },

  metricsRow: {
    flexDirection: "row-reverse",
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: OFF_WHITE,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    ...shadows.card,
  },
  metricValue: {
    ...typography.sectionHeading,
    color: CHARCOAL,
    fontWeight: "800",
    fontSize: 36,
  },
  metricLabel: { ...typography.body, color: MUTED, marginTop: 4 },

  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: { ...typography.cardTitle, color: CHARCOAL, fontWeight: "700" },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionCount: {
    ...typography.body,
    color: MUTED,
    backgroundColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    overflow: "hidden",
    fontWeight: "600",
  },

  memberRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: OFF_WHITE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER,
    ...shadows.card,
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
  },
  memberName: {
    ...typography.body,
    color: CHARCOAL,
    fontWeight: "600",
    flex: 1,
  },
  balanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GREEN,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  balanceBadgeValue: {
    ...typography.caption,
    color: GREEN,
    fontWeight: "700",
    fontSize: 12,
  },
  balanceBadgeLabel: {
    ...typography.caption,
    color: GREEN,
    fontSize: 10,
    marginLeft: 2,
  },

  awardBtn: {
    backgroundColor: GOLD,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  awardBtnText: {
    ...typography.buttonSmall,
    color: CHARCOAL,
    fontWeight: "700",
  },

  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 48, color: MUTED, marginBottom: 12 },
  emptyText: { ...typography.body, color: MUTED },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: OFF_WHITE,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    ...shadows.card,
  },
  modalTitle: {
    ...typography.sectionHeading,
    color: CHARCOAL,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    ...typography.caption,
    color: MUTED,
    marginBottom: 6,
    textAlign: "right",
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...typography.body,
    color: CHARCOAL,
  },
  reasonInput: { minHeight: 80, textAlignVertical: "top" },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },
  modalCancelText: { ...typography.body, color: MUTED, fontWeight: "600" },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: NAVY,
    alignItems: "center",
  },
  modalSubmitBtnDisabled: { opacity: 0.6 },
  modalSubmitText: { ...typography.body, color: "#ffffff", fontWeight: "700" },
});
