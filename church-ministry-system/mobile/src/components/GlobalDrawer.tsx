import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useAuth } from '../hooks/useAuth';
import { typography, spacing } from '../theme';
import { DrawerProvider } from '../contexts/DrawerContext';

interface MenuGroup {
  title: string;
  items: { key: string; icon: string; label: string }[];
}

const SERVANT_MENU: MenuGroup[] = [
  {
    title: 'الخدمة',
    items: [
      { key: 'Preparations', icon: '\u270E', label: 'إعداد الدرس' },
      { key: 'FollowUp', icon: '\u263C', label: 'المتابعة' },
      { key: 'Library', icon: '\u2702', label: 'مكتبة الدروس' },
    ],
  },
  {
    title: 'التفاعل',
    items: [
      { key: 'Achievements', icon: '\u2606', label: 'الإنجازات' },
    ],
  },
  {
    title: 'الحساب',
    items: [
      { key: 'Notifications', icon: '\u2630', label: 'الإشعارات' },
    ],
  },
];

const MEMBER_MENU: MenuGroup[] = [
  {
    title: 'الحساب',
    items: [
      { key: 'Notifications', icon: '\u2630', label: 'الإشعارات' },
    ],
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.82;

interface GlobalDrawerProps {
  children: React.ReactNode;
  navigationRef: { navigate: (name: string, params?: any) => void };
  menuConfig?: MenuGroup[];
}

export default function GlobalDrawer({ children, navigationRef, menuConfig }: GlobalDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  const closeDrawer = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: DRAWER_WIDTH, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setIsOpen(false));
  }, [slideAnim, fadeAnim]);

  const doNavigate = useCallback((screen: string) => {
    closeDrawer();
    navigationRef.navigate(screen);
  }, [closeDrawer, navigationRef]);

  return (
    <DrawerProvider openDrawer={openDrawer}>
      {children}
      {isOpen && (
        <>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeDrawer} activeOpacity={1} />
          </Animated.View>
          <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
            <DrawerContent
              closeDrawer={closeDrawer}
              onNavigate={doNavigate}
              menuConfig={menuConfig}
            />
          </Animated.View>
        </>
      )}
    </DrawerProvider>
  );
}

function DrawerContent({
  closeDrawer,
  onNavigate,
  menuConfig,
}: {
  closeDrawer: () => void;
  onNavigate: (screen: string) => void;
  menuConfig?: MenuGroup[];
}) {
  const { logout, switchContext } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);

  const initials = user?.fullName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const groups = menuConfig || SERVANT_MENU;

  return (
    <SafeAreaView style={styles.drawerContainer}>
      <ScrollView contentContainerStyle={styles.drawerScroll}>
        <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeIcon}>{'\u2715'}</Text>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.fullName}</Text>
        </View>

        {groups.map((group, gi) => (
          <View key={gi} style={styles.menuGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.items.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => onNavigate(item.key)}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.switchRoleBtn} onPress={switchContext} activeOpacity={0.7}>
          <Text style={styles.switchRoleLabel}>{'\u21C4'}  تغيير الدور</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <Text style={styles.logoutLabel}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#192f5f',
    zIndex: 1001,
    elevation: 10,
  },
  drawerContainer: { flex: 1 },
  drawerScroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  closeIcon: { fontSize: 16, color: '#ffffff' },
  userInfo: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { ...typography.subHeading, color: '#ffffff' },
  userName: { ...typography.cardTitle, color: '#ffffff' },
  menuGroup: { marginBottom: spacing.md },
  groupTitle: {
    ...typography.overline,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  menuIcon: { fontSize: 18, color: '#ffffff', marginRight: spacing.md, width: 24, textAlign: 'center' },
  menuLabel: { ...typography.body, color: '#ffffff' },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  switchRoleLabel: { ...typography.button, color: '#ffffff' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c62828',
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  logoutLabel: { ...typography.button, color: '#ffffff' },
});
