import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useLocale } from '../../hooks/useLocale';
import FollowUpListScreen from '../../screens/follow-up/FollowUpListScreen';
import FollowUpDetailScreen from '../../screens/follow-up/FollowUpDetailScreen';
import AddActivityScreen from '../../screens/follow-up/AddActivityScreen';
import CreateFollowUpScreen from '../../screens/follow-up/CreateFollowUpScreen';
import ManageGroupsScreen from '../../screens/follow-up/ManageGroupsScreen';
import MonitoringScreen from '../../screens/follow-up/MonitoringScreen';

const Stack = createNativeStackNavigator();

export default function FollowUpStack() {
  const { t } = useLocale();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FollowUpList" component={FollowUpListScreen} options={{ title: t('followUp.title') }} />
      <Stack.Screen name="FollowUpDetail" component={FollowUpDetailScreen} options={{ title: t('followUp.detail') }} />
      <Stack.Screen name="AddActivity" component={AddActivityScreen} options={{ title: t('followUp.addActivity') }} />
      <Stack.Screen name="CreateFollowUp" component={CreateFollowUpScreen} options={{ title: t('followUp.new') }} />
      <Stack.Screen name="ManageGroups" component={ManageGroupsScreen} options={{ title: 'إدارة المجموعات' }} />
      <Stack.Screen name="Monitoring" component={MonitoringScreen} options={{ title: 'متابعة الافتقاد' }} />
    </Stack.Navigator>
  );
}
