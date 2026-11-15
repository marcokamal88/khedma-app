import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationsApi } from '../api/notifications.api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(memberId: string, churchId: string): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Push notification permissions not granted');
      return null;
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.expoConfig?.extra?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Expo push token:', token);
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  if (token) {
    try {
      await notificationsApi.registerDevice(churchId, memberId, token, Platform.OS);
      console.log('Push token registered with backend');
    } catch (e) {
      console.error('Failed to register push token:', e);
    }
  }

  return token;
}

export function setupNotificationListener(onNotification: (notification: Notifications.Notification) => void) {
  const subscription = Notifications.addNotificationReceivedListener(onNotification);
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    onNotification(response.notification);
  });
  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}

export async function getPushToken(): Promise<string | null> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.expoConfig?.extra?.projectId;
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}