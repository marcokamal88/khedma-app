import React from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

interface AppBadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

export function AppBadge({ label, variant = "info", style }: AppBadgeProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: "flex-start",
  },
  success: { backgroundColor: colors.success },
  warning: { backgroundColor: colors.warning },
  error: { backgroundColor: colors.error },
  info: { backgroundColor: colors.charcoal40 },
  neutral: { backgroundColor: colors.mutedGray },
  text: {
    ...typography.overline,
    color: colors.offWhite,
  },
});
