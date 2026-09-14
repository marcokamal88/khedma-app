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
  Switch,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../hooks/useLocale';
import { typography, spacing } from '../theme';
import { DrawerProvider } from '../contexts/DrawerContext';

const NAVY = '#192f5f';
const GOLD = '#d4a843';
const CRIMSON = '#9b1b30';
const CHARCOAL = '#1c1c1c';

interface MenuItem {
  key: string;
  icon: string;
  label: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const SERVANT_MENU: MenuGroup[] = [
  {
    title: 'الخدمة',
    items: [
      { key: 'Home', icon: '\u2302', label: 'الرئيسية' },
      { key: 'Preparations', icon: '\u270E', label: 'إعداد الدرس' },
      { key: 'Attendance', icon: '\u2637', label: 'الحضور' },
      { key: 'Tasks', icon: '\u2611', label: 'المهام' },
      { key: 'FollowUp', icon: '\u2606', label: 'المتابعة' },
      { key: 'Library', icon: '\u2702', label: 'مكتبة الدروس' },
      { key: 'Achievements', icon: '\u2605', label: 'الإنجازات' },
    ],
  },
  {
    title: 'التفاعل',
    items: [
      { key: 'Taiao', icon: '\u2693', label: 'نقاط طايو' },
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
    title: 'الرئيسية',
    items: [
      { key: 'Home', icon: '\u2302', label: 'الرئيسية' },
    ],
  },
  {
    title: 'الحساب',
    items: [
      { key: 'Notifications', icon: '\u2630', label: 'الإشعارات' },
    ],
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85;

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

const roleToLocaleKey = (role: string) =>
  role.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function DrawerContent({
  closeDrawer,
  onNavigate,
  menuConfig,
}: {
  closeDrawer: () => void;
  onNavigate: (screen: string) => void;
  menuConfig?: MenuGroup[];
}) {
  const { logout } = useAuth();
  const { t } = useLocale();
  const user = useSelector((state: RootState) => state.auth.user);
  const activeContext = useSelector((state: RootState) => state.auth.activeContext);

  const groups = menuConfig || SERVANT_MENU;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeIcon}>{'\u2715'}</Text>
        </TouchableOpacity>
        <View style={styles.profileRow}>
          <View style={styles.profileTextWrap}>
            <Text style={styles.profileName}>{user?.fullName}</Text>
            <Text style={styles.profileRole}>{t(`roles.${roleToLocaleKey(activeContext?.role || 'servant')}`)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.contextCard}>
        <View style={styles.contextInfo}>
          <Text style={styles.contextLabel}>السياق الحالي</Text>
          <Text style={styles.contextValue}>{t('home.classInfo')}</Text>
        </View>
        <TouchableOpacity style={styles.contextSwitchBtn} activeOpacity={0.7} onPress={() => onNavigate('ContextSwitcher')}>
          <Text style={styles.contextSwitchIcon}>{'\u21C4'}</Text>
          <Text style={styles.contextSwitchText}>تبديل</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.menuScroll}
        contentContainerStyle={styles.menuScrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {/* <View style={styles.toggleRow}>
          <View style={styles.toggleBtn}>
            <Text style={styles.toggleIcon}>{'\uD83C\uDF10'}</Text>
            <Text style={styles.toggleLabel} numberOfLines={1}>English</Text>
          </View>
          <View style={[styles.toggleBtn, styles.toggleBtnActive]}>
            <Text style={styles.toggleLabelActive} numberOfLines={1}>عربي</Text>
          </View>
        </View> */}
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
    // Logical edge: physical right while the app forces RTL (I18nManager).
    // Do NOT change back to `right: 0` — under RTL swap it renders on the
    // physical left. Slide animation (+width → 0) already matches this side.
    start: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: NAVY,
    zIndex: 1001,
    elevation: 10,
  },
  container: { flex: 1 },

  topBar: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeBtn: {
    // Outer edge of a right-side drawer (physical left under forced RTL).
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  closeIcon: { fontSize: 16, color: '#ffffff' },

  profileRow: {
    // Right-anchored by packing (not flex): packs the text block at the
    // row start = physical right under RTL. `direction` pins this even if
    // the global RTL flag ever changes.
    flexDirection: 'row',
    direction: 'rtl',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  profileTextWrap: {},
  profileName: { ...typography.cardTitle, color: '#ffffff', fontWeight: '700', textAlign: 'right' },
  profileRole: { ...typography.caption, color: 'rgba(255,255,255,0.5)', marginTop: 2, textAlign: 'right' },

  contextCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    direction: 'rtl',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 14,
  },
  contextInfo: { marginBottom: 10 },
  contextLabel: { ...typography.overline, color: 'rgba(255,255,255,0.4)', marginBottom: 2, textAlign: 'left' },
  contextValue: { ...typography.body, color: '#ffffff', fontWeight: '600', textAlign: 'left' },
  contextSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
  },
  contextSwitchIcon: { fontSize: 13, color: CHARCOAL },
  contextSwitchText: { ...typography.buttonSmall, color: CHARCOAL, fontWeight: '700' },

  menuScroll: { flex: 1 },
  menuScrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },

  menuGroup: { marginBottom: 16 },
  groupTitle: {
    ...typography.overline,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right',
    marginBottom: 8,
    paddingRight: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    // Label first = rightmost under RTL; icon sits immediately left of it.
    // No flex anywhere, so label/icon are always adjacent — a gap between
    // them is structurally impossible (flex:1 + textAlign proved unreliable).
    flexDirection: 'row',
    direction: 'rtl',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  menuLabel: { ...typography.body, color: '#ffffff', textAlign: 'right' },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  toggleIcon: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  toggleLabel: { ...typography.buttonSmall, color: 'rgba(255,255,255,0.4)' },
  toggleLabelActive: { ...typography.buttonSmall, color: '#ffffff', fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CRIMSON,
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutLabel: { ...typography.button, color: '#ffffff', fontWeight: '600' },
});
