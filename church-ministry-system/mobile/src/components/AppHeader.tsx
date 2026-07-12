import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { typography } from "../theme";

const NAVY = "#192f5f";

interface AppHeaderProps {
  greetingText: string;
  children?: React.ReactNode;
}

export default function AppHeader({ greetingText, children }: AppHeaderProps) {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <>
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
            <Text style={styles.bellIcon}>{"\uD83D\uDD14"}</Text>
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
