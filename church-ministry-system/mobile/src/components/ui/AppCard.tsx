import React, { ReactNode } from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { colors, spacing, borderRadius } from "../../theme";

interface AppCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "flat" | "bordered" | "highlighted";
}

export function AppCard({ children, style, variant = "flat" }: AppCardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === "bordered" && styles.bordered,
        variant === "highlighted" && styles.highlighted,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.cream,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlighted: {
    borderWidth: 1,
    borderColor: colors.charcoal,
  },
});
