import { initializeKakaoSDK } from '@react-native-kakao/core';
import { login } from '@react-native-kakao/user';

import { KAKAO_NATIVE_APP_KEY } from '@/constants/config';

let isInitialized = false;

async function ensureKakaoInitialized(): Promise<void> {
  if (isInitialized) {
    return;
  }

  if (!KAKAO_NATIVE_APP_KEY) {
    throw new Error('EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY가 설정되지 않았습니다.');
  }

  await initializeKakaoSDK(KAKAO_NATIVE_APP_KEY);
  isInitialized = true;
}

/**
 * 카카오 네이티브 SDK 로그인 후 accessToken 반환
 */
export async function signInWithKakao(): Promise<string> {
  await ensureKakaoInitialized();
  const token = await login();
  return token.accessToken;
}
