import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useLocale } from '../../hooks/useLocale';
import ChildrenScreen from '../../screens/parent/ChildrenScreen';
import ChildDetailScreen from '../../screens/parent/ChildDetailScreen';
import EventsScreen from '../../screens/parent/EventsScreen';
import ContextSwitcherScreen from '../../screens/auth/ContextSwitcherScreen';
import NotificationsScreen from '../../screens/shared/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function ParentStack() {
  const { t } = useLocale();
  return (
    <Stack.Navigator>
      <Stack.Screen name="Children" component={ChildrenScreen} options={{ title: t('parent.myChildren') }} />
      <Stack.Screen name="ChildDetail" component={ChildDetailScreen} options={({ route }: any) => ({ title: route.params?.childName || t('tabs.profile') })} />
      <Stack.Screen name="Events" component={EventsScreen} options={{ title: t('tabs.events') }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: t('tabs.notifications') }} />
      <Stack.Screen name="SwitchContext" component={ContextSwitcherScreen} options={{ title: t('auth.switchContext') }} />
    </Stack.Navigator>
  );
}
