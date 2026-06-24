import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useLocale } from '../../hooks/useLocale';
import FollowUpListScreen from '../../screens/follow-up/FollowUpListScreen';
import FollowUpDetailScreen from '../../screens/follow-up/FollowUpDetailScreen';
import AddActivityScreen from '../../screens/follow-up/AddActivityScreen';
import CreateFollowUpScreen from '../../screens/follow-up/CreateFollowUpScreen';

const Stack = createNativeStackNavigator();

export default function FollowUpStack() {
  const { t } = useLocale();
  return (
    <Stack.Navigator>
      <Stack.Screen name="FollowUpList" component={FollowUpListScreen} options={{ title: t('followUp.title') }} />
      <Stack.Screen name="FollowUpDetail" component={FollowUpDetailScreen} options={{ title: t('followUp.detail') }} />
      <Stack.Screen name="AddActivity" component={AddActivityScreen} options={{ title: t('followUp.addActivity') }} />
      <Stack.Screen name="CreateFollowUp" component={CreateFollowUpScreen} options={{ title: t('followUp.new') }} />
    </Stack.Navigator>
  );
}
