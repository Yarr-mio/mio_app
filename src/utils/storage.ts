import * as SecureStore from 'expo-secure-store';

/**
 * Secure Storage 래퍼
 */
const STORAGE_KEYS = {
  refreshToken: 'auth.refresh_token',
  deviceId: 'device.id',
  chatRedirectedSessionId: 'chat.redirected_session_id',
} as const;

/**
 * 값 기록
 *
 * - `WHEN_UNLOCKED_THIS_DEVICE_ONLY`:
 *   기기 잠금 해제 상태에서만 접근 가능 + 다른 기기로 백업/이동되지 않도록 제한
 */
async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * 값 조회
 */
async function getItem(key: string): Promise<string | null> {
  return await SecureStore.getItemAsync(key);
}

/**
 * 안전 저장소에서 값 삭제
 */
async function deleteItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

export const storage = {
  refreshToken: {
    get: () => getItem(STORAGE_KEYS.refreshToken),
    set: (token: string) => setItem(STORAGE_KEYS.refreshToken, token),
    delete: () => deleteItem(STORAGE_KEYS.refreshToken),
  },
  deviceId: {
    get: () => getItem(STORAGE_KEYS.deviceId),
    set: (id: string) => setItem(STORAGE_KEYS.deviceId, id),
    delete: () => deleteItem(STORAGE_KEYS.deviceId),
  },
  // last_summary_status가 viewed로 안 바뀌어도 같은 세션으로 재진입 리다이렉트를 반복하지 않기 위한 로컬 가드
  chatRedirectedSessionId: {
    get: () => getItem(STORAGE_KEYS.chatRedirectedSessionId),
    set: (sessionId: string) => setItem(STORAGE_KEYS.chatRedirectedSessionId, sessionId),
  },
};
