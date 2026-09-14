import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { RootState } from "../store";
import { setUnreadCount } from "../store/notifications.slice";
import { notificationsApi } from "../api/notifications.api";
import { typography } from "../theme";

const NAVY = "#192f5f";

interface AppHeaderProps {
  greetingText: string;
  children?: React.ReactNode;
}

export default function AppHeader({ greetingText, children }: AppHeaderProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const unreadCount = useSelector((state: RootState) => state.notifications.unreadCount);
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();

  // Lightweight badge count; the inbox screen owns the full list state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await notificationsApi.unreadCount();
        const count = res?.data?.unreadCount ?? res?.unreadCount ?? 0;
        if (!cancelled) dispatch(setUnreadCount(Number(count) || 0));
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [dispatch]);

  return (
    <>
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Text style={styles.bellIcon}>{"\uD83D\uDD14"}</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : String(unreadCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.greeting} numberOfLines={1}>{greetingText}</Text>
            <Text style={styles.userName} numberOfLines={1}>{user?.fullName}</Text>
          </View>
        </View>
        {children}
      </View>
      <View style={styles.waveContainer}>
        <Text style={styles.waveDummy}>{""}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    backgroundColor: NAVY,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bellIcon: { fontSize: 20, color: "#ffffff" },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#c62828",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, color: "#ffffff", fontWeight: "700" },
  headerTextWrap: { flex: 1, marginLeft: 12 },
  greeting: {
    ...typography.body,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 2,
    textAlign: "left",
  },
  userName: {
    ...typography.sectionHeading,
    color: "#ffffff",
    marginBottom: 4,
    textAlign: "left",
  },
  waveContainer: {
    height: 30,
    backgroundColor: NAVY,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: -8,
  },
  waveDummy: { height: 0 },
});
