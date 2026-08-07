import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  LAST_OS_NOTIFICATION_PERMISSION_STORAGE_KEY,
  OS_PERMISSION_GRANTED_STORAGE_VALUE,
} from '@/constants/notifications';

// 마지막 확인한 OS 알림 권한 상태 조회함
// 저장된 값이 없으면 null 반환함
export async function getLastOsNotificationPermissionGranted(): Promise<boolean | null> {
  const raw = await AsyncStorage.getItem(LAST_OS_NOTIFICATION_PERMISSION_STORAGE_KEY);

  if (raw === OS_PERMISSION_GRANTED_STORAGE_VALUE.granted) {
    return true;
  }

  if (raw === OS_PERMISSION_GRANTED_STORAGE_VALUE.denied) {
    return false;
  }

  return null;
}

// 마지막 확인한 OS 알림 권한 상태 기록함
export async function setLastOsNotificationPermissionGranted(granted: boolean): Promise<void> {
  await AsyncStorage.setItem(
    LAST_OS_NOTIFICATION_PERMISSION_STORAGE_KEY,
    granted
      ? OS_PERMISSION_GRANTED_STORAGE_VALUE.granted
      : OS_PERMISSION_GRANTED_STORAGE_VALUE.denied
  );
}
