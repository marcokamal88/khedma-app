import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
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
  rightElement?: React.ReactNode;
}

export default function AppHeader({ greetingText, children, rightElement }: AppHeaderProps) {
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
          <View style={styles.headerTextWrap}>
            <Text style={styles.greeting} numberOfLines={1}>{greetingText}</Text>
            <Text style={styles.userName} numberOfLines={1}>{user?.fullName}</Text>
          </View>
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
        </View>
        {children}
      {rightElement && (
        <View style={styles.rightElementWrapper}>
          {rightElement}
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 36,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bellIcon: { fontSize: 17, color: "#ffffff" },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#c62828",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, color: "#ffffff", fontWeight: "700" },
  headerTextWrap: { flex: 1, marginLeft: 10 },
  greeting: {
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 2,
    textAlign: "right",
  },
  userName: {
    fontSize: 18,
    lineHeight: 22,
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "right",
  },
  waveContainer: {
    height: 14,
    backgroundColor: NAVY,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: -6,
  },
  waveDummy: { height: 0 },
  rightElementWrapper: { marginTop: 6, alignItems: 'flex-start' },
});
