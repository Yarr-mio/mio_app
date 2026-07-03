import Constants from 'expo-constants';
import { Platform } from 'react-native';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

/**
 * 앱 버전 문자열 구함
 *
 * - Expo Router/Expo 앱에서 버전은 주로 `Constants.expoConfig.version`에 존재
 * - 일부 환경에서는 `Constants.manifest.version` 형태로 내려오는 경우가 있어 안전하게 폴백
 */
export function getAppVersion(): string {
  // unavoidable cast: expo-constants 타입이 런타임 필드(Constants.manifest)를 노출하지 않는 환경이 있어 안전한 폴백을 위해 접근
  const manifest = (Constants as unknown as { manifest?: unknown }).manifest;
  const maybeManifestVersion =
    isRecord(manifest) && typeof manifest.version === 'string' ? manifest.version : null;

  return Constants.expoConfig?.version || maybeManifestVersion || '0.0.0';
}

export type DevicePlatform = 'ios' | 'android';

export function getDevicePlatform(): DevicePlatform | null {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return Platform.OS;
  }

  return null;
}
