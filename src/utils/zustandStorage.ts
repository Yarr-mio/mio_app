import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

const SECURE_STORE_OPTIONS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as const;

/**
 * Zustand persist용 storage adapter
 * 토큰 저장(`auth.refresh_token`)과 별도 키로 사용
 */
export const zustandStorage: StateStorage = {
  getItem: (name) => SecureStore.getItemAsync(name),
  setItem: (name, value) => SecureStore.setItemAsync(name, value, SECURE_STORE_OPTIONS),
  removeItem: (name) => SecureStore.deleteItemAsync(name),
};
