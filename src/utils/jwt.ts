/**
 * JWT payload segment를 base64url 디코딩한다. 서명 검증은 하지 않는다.
 * 애플 로그인 관련 디버깅용!! 추후 디버깅 완료 후 제거 예정.
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
