/**
 * 대화 요약 화면 자동 이동 가드
 *
 * 요약 화면으로 가는 `router.push`가 세 곳(정상 종료 `useChat`, 서버 선종료 410 `useChatSse`,
 * 재진입 리다이렉트 `chat/index`)인데 서로의 존재를 모른다. 종료 한 번에 두 경로가 같은 세션으로
 * push하면 동일한 로딩 화면이 두 장 쌓인다(chat-trouble-shoot: 로딩 화면 이중 노출).
 *
 * ⚠️ 가드를 컴포넌트의 `useRef`에 두면 안 된다 — 마운트 단위 가드는 push 경로가 다르면 서로를
 * 막지 못하고, 반대로 같은 마운트 안에서는 진짜 필요한 리다이렉트까지 막는다. 세션 id 단위의
 * 모듈 스코프 claim이어야 한다(`analytics/summaryViewGuard.ts`와 동일한 패턴).
 */

import { router } from 'expo-router';
import { MAIN_ROUTES } from '@/constants/routes';

/**
 * 이번 실행에서 요약 화면 자동 이동 판단이 끝난 세션 — 같은 세션으로 화면이 두 장 쌓이는 것을 막는다.
 *
 * 이 claim은 "이 세션의 자동 이동은 처리가 끝났다"를 뜻한다. 처리 결과는 두 가지다 —
 * `pushSessionSummaryOnce()`로 **보냈거나**, `skipSessionSummaryNavigation()`으로 **보내지 않기로 했거나**.
 * 어느 쪽이든 다른 push 경로가 뒤늦게 끼어들면 안 되므로 같은 Set을 공유한다.
 *
 * 보낸 경우에 한해 "그 화면이 아직 스택에 있다"는 전제가 따라붙는데, 그 전제가 깨지는 경로가 생기면
 * (예: 탭 재클릭으로 스택이 루트로 리셋) 아무도 요약으로 되돌려 보낼 수 없어 대기 화면에서
 * 고착되므로, 화면이 사라진 것이 확인된 쪽에서 `releaseSessionSummaryNavigation()`으로 풀어준다.
 */
const navigatedSessionIds = new Set<string>();

/**
 * 자동 이동 전용. 이미 이동한 세션이면 아무것도 하지 않고 `false`를 돌려준다.
 *
 * 향후 "지난 요약 다시 보기" 같은 사용자 주도 진입점이 생기면 이 함수를 쓰지 말고 직접 push해야 한다.
 */
export function pushSessionSummaryOnce(sessionId: string): boolean {
  if (navigatedSessionIds.has(sessionId)) {
    return false;
  }

  navigatedSessionIds.add(sessionId);
  router.push({ pathname: MAIN_ROUTES.chatSummary, params: { sessionId } });
  return true;
}

/**
 * 이 세션은 요약 화면을 띄우지 않기로 했다 — push 없이 claim만 잡아, 다른 경로(`chat/index`의 재진입
 * 리다이렉트)가 대신 보내버리는 것까지 함께 막는다. `pushSessionSummaryOnce()`와 **같은 Set**을 쓰는 것이
 * 핵심이다. 별도 플래그로 나누면 세 push 경로가 다시 서로를 모르게 된다.
 */
export function skipSessionSummaryNavigation(sessionId: string): void {
  navigatedSessionIds.add(sessionId);
}

/**
 * 요약 화면이 스택에서 **사라진 것이 확인됐을 때만** 호출한다 — 그 세션을 다시 보낼 수 있게 claim을 푼다.
 *
 * ⚠️ "요약 화면이 언마운트됐다"는 근거로 쓰면 안 된다. 정상 이탈(`SessionEnd`의 `dismissAll()`)에서도
 * 언마운트되므로, 방금 확인한 요약을 다시 push하게 되어 이 가드가 막으려던 이중 노출로 되돌아간다.
 * 유일하게 안전한 근거는 **대기 화면(`chat/index`)이 포커스를 잡았다**는 사실이다 — 요약 화면이 덮고
 * 있는 동안에는 대기 화면이 마운트돼 있어도 포커스를 갖지 않는다.
 */
export function releaseSessionSummaryNavigation(sessionId: string): void {
  navigatedSessionIds.delete(sessionId);
}
