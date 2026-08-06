/**
 * JWT payload segment를 base64url 디코딩한다. 서명 검증은 하지 않는다.
 *
 * 용도: access token의 `sub`에서 `user_id`를 파싱한다 (이벤트 계측 envelope · `identify` 발행).
 * 서버 `JwtTokenService`가 `.subject(userId)`로 발급하므로 `sub`가 곧 유저 id다.
 * 앱은 로그인 응답에서 유저 id를 따로 보관하지 않으므로(신규 가입 흐름에서는 `user`가 null)
 * 이 함수가 `user_id`의 유일한 원천이다 — 제거하면 계측의 유저 식별이 통째로 빈다.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  try {
    const base64Url = segments[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = globalThis.atob(base64 + padding);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * access token의 `sub`(= 서버 userId)를 읽는다. 토큰이 없거나 파싱에 실패하면 null.
 */
export function readUserIdFromAccessToken(accessToken: string | null): string | null {
  if (!accessToken) {
    return null;
  }

  const payload = decodeJwtPayload(accessToken);
  const subject = payload?.sub;
  return typeof subject === 'string' && subject.length > 0 ? subject : null;
}
