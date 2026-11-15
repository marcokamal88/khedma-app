import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootParamList>;

const SOURCE_ROUTES: Record<string, { screen: keyof RootParamList; paramKey?: string }> = {
  task: { screen: 'TaskDetail', paramKey: 'taskId' },
  preparation: { screen: 'Preparations', paramKey: undefined },
  followup: { screen: 'FollowUpDetail', paramKey: 'familyId' },
  event: { screen: 'Events', paramKey: undefined },
  payment: { screen: 'Events', paramKey: undefined },
};

export function usePushNotifications() {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const handleNotification = (notification: Notifications.Notification) => {
      const data = notification.request.content.data as any;
      if (!data?.sourceType || !SOURCE_ROUTES[data.sourceType]) return;

      const route = SOURCE_ROUTES[data.sourceType];
      if (route.paramKey && data.sourceId) {
        // @ts-expect-error dynamic navigation params
        navigation.navigate(route.screen, { [route.paramKey]: data.sourceId });
      } else {
        navigation.navigate(route.screen as any);
      }
    };

    const subscription = Notifications.addNotificationReceivedListener(handleNotification);
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => handleNotification(response.notification)
    );

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, [navigation]);
}