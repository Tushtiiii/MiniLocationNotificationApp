/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import notifee from 'react-native-notify-kit';
import App from './App';
import { name as appName } from './app.json';

// Handles FCM messages received while the app is in the background or quit.
// Notification-payload messages are displayed automatically by the system on
// Android; this handler covers data-only messages by rendering them locally.
setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
  const { notification, data } = remoteMessage;

  await notifee.createChannel({
    id: 'default',
    name: 'General Notifications',
    importance: 4, // AndroidImportance.HIGH
  });

  await notifee.displayNotification({
    title: notification?.title ?? data?.title ?? 'Notification',
    body: notification?.body ?? data?.body ?? '',
    data: data ?? {},
    android: {
      channelId: 'default',
      pressAction: {
        id: 'default',
      },
    },
  });
});

AppRegistry.registerComponent(appName, () => App);
