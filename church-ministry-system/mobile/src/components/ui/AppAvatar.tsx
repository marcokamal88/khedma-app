import React from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";

interface AppAvatarProps {
  name: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function AppAvatar({ name, size = 40, style }: AppAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.charcoal,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: colors.offWhite,
    fontWeight: "600",
  },
});
