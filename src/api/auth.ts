/**
 * Auth API 진입점(re-export 레이어).
 *
 * 사용자 요구사항:
 * - "모든 API 호출은 `src/api/auth.ts` 같은 별도 레이어에 분리"
 *
 * 이 파일은 도메인(Auth) API의 public surface를 제공한다.
 * 실제 구현(fetcher)은 SRP에 맞게 `src/api/endpoints/auth.ts`에 두고,
 * 여기서는 "어디에서 import 해야 하는지"를 한 곳으로 모아준다.
 *
 * 장점:
 * - UI/훅 레이어는 `@/api/auth`만 알면 된다.
 * - 내부 폴더 구조 변경(`endpoints/*` 분리 등)이 생겨도 import 경로 변경이 최소화된다.
 */
export {
  getAuthNicknameDuplicateCheck,
  getAuthSignupStatus,
  postAuthLogin,
  postAuthLogout,
  postAuthRefresh,
  postAuthSignupComplete,
} from '@/api/endpoints/auth';
