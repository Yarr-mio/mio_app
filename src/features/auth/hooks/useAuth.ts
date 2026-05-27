import { useMutation } from '@tanstack/react-query';

import { postAuthLogin, postAuthLogout, postAuthRefresh } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import type { AuthLoginResponse, SocialProvider } from '@/types/auth';
import { storage } from '@/utils/storage';

/**
 * Auth 관련 TanStack Query 훅 모음.
 *
 * 레이어 책임(CODING_RULES.md #1/#11):
 * - endpoints(auth.ts)는 "순수 API 호출"만 담당한다.
 * - 이 파일은 TanStack Query의 `useMutation`으로 감싸서,
 *   "호출 상태(isPending/isError 등)"와 "성공 시 side-effect(토큰 저장)"를 담당한다.
 *
 * 저장 정책(요구사항 #5):
 * - access_token: Zustand 메모리 상태에 저장 (앱 재시작 시 초기화됨)
 * - refresh_token: Secure Storage에 저장 (앱 재시작 후에도 유지됨)
 */
interface SocialLoginInput {
  provider: SocialProvider;
  id_token: string | null;
  access_token: string | null;
}

/**
 * 소셜 로그인 mutation.
 *
 * - 성공 시: access_token → 메모리 저장, refresh_token → Secure Storage 저장
 * - 이후 다른 API 요청은 `api/client.ts` request interceptor가 Authorization 헤더를 자동 주입한다.
 */
export function useSocialLogin() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  return useMutation<AuthLoginResponse, Error, SocialLoginInput>({
    mutationFn: (input) => postAuthLogin(input),
    onSuccess: async (res) => {
      setAccessToken(res.data.access_token);
      await storage.refreshToken.set(res.data.refresh_token);
    },
  });
}

/**
 * 로그아웃 mutation.
 *
 * - 서버에는 "현재 device_id의 세션만" 무효화 요청 (POST /v1/auth/logout)
 * - 로컬에서는 즉시 access/refresh 토큰을 삭제해 "로그인 상태"를 해제한다.
 */
export function useLogout() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  return useMutation({
    mutationFn: () => postAuthLogout(),
    onSuccess: async () => {
      setAccessToken(null);
      await storage.refreshToken.delete();
    },
  });
}

/**
 * refresh_token 기반 Access Token 갱신 mutation.
 *
 * 참고:
 * - 실제 앱 흐름에서는 `api/client.ts` 인터셉터가 401(AUTH_TOKEN_EXPIRED)에서 자동 갱신을 수행한다.
 * - 하지만 앱 시작 시 스플래시에서 "refresh_token이 있으면 미리 갱신" 같은 케이스에서
 *   UI 레이어가 직접 사용할 수 있도록 별도 훅으로도 제공한다.
 */
export function useRefreshToken() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  return useMutation({
    mutationFn: async () => {
      const refreshToken = await storage.refreshToken.get();
      if (!refreshToken) {
        throw new Error('Missing refresh token');
      }
      return await postAuthRefresh({ refresh_token: refreshToken });
    },
    onSuccess: (res) => {
      setAccessToken(res.data.access_token);
    },
  });
}
