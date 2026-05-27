import * as SecureStore from 'expo-secure-store';

/**
 * Secure Storage 래퍼.
 *
 * 요구사항:
 * - refresh_token은 Secure Storage(iOS Keychain / Android EncryptedSharedPreferences)에 저장
 * - device_id는 최초 생성 후 영속 저장
 *
 * 구현 포인트:
 * - `expo-secure-store`는 플랫폼별 안전한 저장소를 사용한다.
 * - 키 문자열은 한 곳(`STORAGE_KEYS`)에서만 관리해 오타/중복을 방지한다.
 * - set/get/delete를 공통 함수로 두어 저장 정책(옵션)을 일관되게 적용한다.
 */
const STORAGE_KEYS = {
  refreshToken: 'auth.refresh_token',
  deviceId: 'device.id',
} as const;

/**
 * 안전 저장소에 값을 기록한다.
 *
 * - `WHEN_UNLOCKED_THIS_DEVICE_ONLY`:
 *   기기 잠금 해제 상태에서만 접근 가능 + 다른 기기로 백업/이동되지 않도록 제한.
 *   (토큰과 같은 민감정보에 적합)
 */
async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * 안전 저장소에서 값을 조회한다.
 *
 * 저장된 값이 없으면 null을 반환한다.
 */
async function getItem(key: string): Promise<string | null> {
  return await SecureStore.getItemAsync(key);
}

/**
 * 안전 저장소에서 값을 삭제한다.
 */
async function deleteItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

/**
 * 도메인별로 의미 있는 인터페이스를 노출한다.
 *
 * - refreshToken: 로그인 시 발급되는 refresh_token 저장소
 * - deviceId: 앱 설치 이후 고정되는 device_id 저장소
 */
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
};
