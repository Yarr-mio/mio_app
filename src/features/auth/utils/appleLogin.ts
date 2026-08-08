import * as AppleAuthentication from 'expo-apple-authentication';
import * as Application from 'expo-application';

import { decodeJwtPayload } from '@/utils/jwt';

export type AppleSignInResult = { cancelled: true } | { cancelled: false; identityToken: string };

function logAppleIdentityTokenClaimsInDev(identityToken: string): void {
  if (!__DEV__) {
    return;
  }

  const payload = decodeJwtPayload(identityToken);
  if (!payload) {
    console.log('[Apple Login] identityToken JWT payload decode failed');
    return;
  }

  const aud = payload.aud;
  const iss = payload.iss;
  const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
  // 설치된 바이너리의 실제 번들 ID — OTA로 오염되는 Constants.expoConfig 대신 사용
  const expectedBundleId = Application.applicationId ?? '(unknown)';
  const audValue = Array.isArray(aud) ? aud.join(', ') : aud;
  const audMatchesExpectedBundleId =
    typeof aud === 'string'
      ? aud === expectedBundleId
      : Array.isArray(aud)
        ? aud.includes(expectedBundleId)
        : false;

  const nowSec = Math.floor(Date.now() / 1000);
  const isExpired = exp !== undefined ? exp <= nowSec : undefined;
  const secondsUntilExpiry = exp !== undefined ? exp - nowSec : undefined;

  console.log('[Apple Login] identityToken claims:', {
    aud: audValue,
    iss,
    exp,
    expectedBundleId,
    audMatchesExpectedBundleId,
    isExpired,
    secondsUntilExpiry,
  });
}

/**
 * Apple 네이티브 로그인 후 identityToken 반환
 */
export async function signInWithApple(): Promise<AppleSignInResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple 로그인 identityToken을 받지 못했습니다.');
    }

    logAppleIdentityTokenClaimsInDev(credential.identityToken);

    return { cancelled: false, identityToken: credential.identityToken };
  } catch (error) {
    if (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ERR_REQUEST_CANCELED'
    ) {
      return { cancelled: true };
    }

    throw error;
  }
}
