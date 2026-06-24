import React, { ReactNode } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { AppButton } from './AppButton';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger' }[];
}

export function AppModal({ visible, onClose, title, children, actions }: AppModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {title && <Text style={styles.title}>{title}</Text>}
          <View style={styles.body}>{children}</View>
          {actions && (
            <View style={styles.actions}>
              {actions.map((action, i) => (
                <AppButton
                  key={i}
                  title={action.label}
                  onPress={action.onPress}
                  variant={action.variant || 'primary'}
                  size="sm"
                  style={i < actions.length - 1 ? { marginEnd: spacing.sm } : undefined}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    ...typography.subHeading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  body: {
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
});
