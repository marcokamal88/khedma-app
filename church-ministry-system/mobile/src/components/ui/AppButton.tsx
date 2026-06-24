import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  size = 'md',
}: AppButtonProps) {
  const height = size === 'sm' ? 36 : size === 'lg' ? 52 : 44;
  const paddingHorizontal = size === 'sm' ? spacing.sm : size === 'lg' ? spacing.xl : spacing.md;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        { height, paddingHorizontal },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' || variant === 'success' ? colors.offWhite : colors.charcoal}
        />
      ) : (
        <Text
          style={[
            styles[`${variant}Text` as keyof typeof styles] as TextStyle,
            size === 'sm' && typography.buttonSmall,
            size !== 'sm' && typography.button,
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: colors.charcoal,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.charcoal40,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error,
  },
  success: {
    backgroundColor: colors.success,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: colors.offWhite,
  },
  secondaryText: {
    color: colors.charcoal,
  },
  ghostText: {
    color: colors.charcoal,
  },
  dangerText: {
    color: colors.offWhite,
  },
  successText: {
    color: colors.offWhite,
  },
  disabledText: {
    opacity: 0.7,
  },
});
