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

/** 이번 실행에서 요약 화면으로 자동 이동시킨 세션 — 같은 세션으로 화면이 두 장 쌓이는 것을 막는다 */
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
