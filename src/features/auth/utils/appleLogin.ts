import * as AppleAuthentication from 'expo-apple-authentication';

export type AppleSignInResult = { cancelled: true } | { cancelled: false; identityToken: string };

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
