import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '../../theme';

interface Tab {
  key: string;
  label: string;
  icon: string;
}

interface AppTabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  style?: StyleProp<ViewStyle>;
}

const TAB_ICONS: Record<string, string> = {
  home: '\u2302',
  dashboard: '\u2302',
  tasks: '\u2611',
  attendance: '\u2637',
  preparation: '\u270E',
  taio: '\u2605',
  store: '\u2693',
  notifications: '\u2630',
  followUp: '\u263C',
  achievements: '\u2606',
  library: '\u2702',
  reports: '\u2261',
  reviews: '\u2691',
  switchContext: '\u21C4',
  children: '\u263A',
  events: '\u2637',
  activities: '\u2692',
  balance: '\u2605',
  default: '\u25CF',
};

export function AppTabBar({ tabs, activeTab, onTabChange, style }: AppTabBarProps) {
  return (
    <View style={[styles.container, style]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>
              {TAB_ICONS[tab.icon] || TAB_ICONS[tab.key] || TAB_ICONS.default}
            </Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 4,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs },
  icon: { fontSize: 20, color: colors.tabInactive },
  iconActive: { color: colors.charcoal },
  label: { ...typography.caption, color: colors.tabInactive, marginTop: 2 },
  labelActive: { color: colors.charcoal, fontWeight: '600' },
});
