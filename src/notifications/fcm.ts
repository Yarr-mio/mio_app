import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { NOTIFICATION_CHANNEL, NOTIFICATION_PERMISSION } from '@/constants/notifications';
import { storage } from '@/utils/storage';

function isAndroid(): boolean {
  return Platform.OS === 'android';
}

function isIos(): boolean {
  return Platform.OS === 'ios';
}

function isAndroidRuntimePermissionRequired(): boolean {
  return (
    isAndroid() &&
    Number(Platform.Version) >= NOTIFICATION_PERMISSION.androidRuntimePermissionVersion
  );
}

async function ensureAndroidNotificationChannelAsync(): Promise<void> {
  if (!isAndroid()) {
    return;
  }

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL.id, {
    name: NOTIFICATION_CHANNEL.name,
    importance: Notifications.AndroidImportance.HIGH,
  });
}

function hasNotificationPermission(settings: Notifications.NotificationPermissionsStatus): boolean {
  return (
    settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function requestPlatformNotificationPermissionAsync(): Promise<boolean> {
  if (isAndroid()) {
    await ensureAndroidNotificationChannelAsync();

    if (!isAndroidRuntimePermissionRequired()) {
      return hasNotificationPermission(await Notifications.getPermissionsAsync());
    }

    const settings = await Notifications.requestPermissionsAsync();
    return hasNotificationPermission(settings);
  }

  if (isIos()) {
    const settings = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return hasNotificationPermission(settings);
  }

  return false;
}

export async function getNotificationPermissionGrantedAsync(): Promise<boolean> {
  if (isAndroid()) {
    await ensureAndroidNotificationChannelAsync();
  }

  const settings = await Notifications.getPermissionsAsync();
  return hasNotificationPermission(settings);
}

export async function requestNotificationPermissionAsync(): Promise<boolean> {
  return await requestPlatformNotificationPermissionAsync();
}

export async function getNativeDevicePushTokenAsync({
  requestPermission = false,
}: {
  requestPermission?: boolean;
} = {}): Promise<string | null> {
  const granted = requestPermission
    ? await requestNotificationPermissionAsync()
    : await getNotificationPermissionGrantedAsync();

  if (!granted) {
    return null;
  }

  const token = await Notifications.getDevicePushTokenAsync();
  const normalizedToken = String(token.data).trim();
  return normalizedToken.length > 0 ? normalizedToken : null;
}

export async function rememberRegisteredPushToken(token: string): Promise<void> {
  await storage.pushToken.set(token);
}

export async function getRememberedPushToken(): Promise<string | null> {
  return await storage.pushToken.get();
}

export async function forgetRegisteredPushToken(): Promise<void> {
  await storage.pushToken.delete();
}

export function subscribeNativePushTokenRefresh(
  listener: (token: string) => void | Promise<void>
): Notifications.EventSubscription {
  return Notifications.addPushTokenListener((devicePushToken) => {
    const token = String(devicePushToken.data).trim();
    if (token.length === 0) {
      return;
    }

    Promise.resolve(listener(token)).catch((error) => {
      console.error('[subscribeNativePushTokenRefresh]', error);
    });
  });
}
