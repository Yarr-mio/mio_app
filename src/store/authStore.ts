import { create } from 'zustand';

/**
 * Auth 전역 클라이언트 상태(Zustand).
 *
 * Coding Rules 준수:
 * - Zustand에는 "서버 데이터"를 저장하지 않는다. (서버 데이터는 TanStack Query)
 * - 여기서는 "클라이언트에서만 의미가 있는 값"만 둔다.
 *
 * 이 파일이 담당하는 것:
 * - accessToken: 메모리에만 유지되는 Access Token (요구사항 #5)
 * - onAuthInvalid: refresh_token 무효 등으로 "강제 로그아웃"이 필요할 때
 *   라우팅(로그인 화면 이동)을 수행하기 위한 콜백 핸들러
 *
 * 참고:
 * - 네비게이션/라우터는 React 컴포넌트 컨텍스트에서만 접근 가능하므로,
 *   인터셉터 같은 비-React 코드에서는 직접 router를 못 쓴다.
 * - 그래서 `app/_layout.tsx`에서 router.replace를 콜백으로 등록해 두고,
 *   `api/client.ts`에서 필요할 때 호출한다.
 */
interface AuthStoreState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;

  onAuthInvalid: (() => void) | null;
  setOnAuthInvalid: (handler: (() => void) | null) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),

  onAuthInvalid: null,
  setOnAuthInvalid: (handler) => set({ onAuthInvalid: handler }),
}));
