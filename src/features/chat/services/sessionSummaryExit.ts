/**
 * 요약 화면에서 사용자를 내보내는 두 경로.
 *
 * 두 경로는 목적지뿐 아니라 **자동 이동 가드를 다루는 방향이 정반대**다. 한 파일에 나란히 두어
 * 다음에 고칠 때 반대로 쓰는 일이 없게 한다.
 */

import { MAIN_ROUTES } from '@/constants/routes';
import { releaseSessionSummaryNavigation } from '@/features/chat/services/sessionSummaryNavigation';
import { useChatStore } from '@/features/chat/store/chatStore';
import { storage } from '@/utils/storage';
import { router } from 'expo-router';

/**
 * 요약이 아직 생성 중일 때 사용자가 먼저 나가는 경로 — **나중에 다시 볼 수 있어야 한다.**
 *
 * 순서를 바꾸면 안 된다: ① 이동 claim을 풀어야 이 세션으로 다시 보낼 수 있고 ② 영속 가드를 지워야
 * 채팅 탭 재진입 리다이렉트가 살아나며 ③ reset()을 빠뜨리면 sessionPhase가 'ended'로 남아
 * chat/index가 빈 배경으로 고착된다. ④⑤는 SessionEnd.handleGoHome과 같은 이유로 순서 고정 —
 * 탭을 먼저 바꾸면 dismissAll()의 타겟이 보장되지 않는다.
 */
export function exitSummaryToHome(sessionId: string): void {
  releaseSessionSummaryNavigation(sessionId);
  void storage.chatRedirectedSessionId.delete();
  useChatStore.getState().reset();
  router.dismissAll();
  router.replace(MAIN_ROUTES.home);
}

/**
 * 요약 생성이 영구 실패(410)해 더 볼 것이 없는 경로 — **다시는 이 세션의 요약으로 보내면 안 된다.**
 *
 * 그래서 위와 정반대로, claim을 풀지 않고 영속 가드를 오히려 **기록**한다. 해제/삭제하면
 * chat/index의 재진입 리다이렉트가 곧바로 같은 세션의 요약으로 다시 push해 410 화면을 왕복한다.
 *
 * 목적지는 채팅 스택의 루트(chat/index)다 — dismissAll()로 도착하고, reset()으로 sessionPhase가
 * 'idle'이 되어 그 화면이 SessionStart를 그린다. 홈을 거치는 우회가 필요 없다.
 */
export function exitSummaryToChatStart(sessionId: string): void {
  void storage.chatRedirectedSessionId.set(sessionId);
  useChatStore.getState().reset();
  router.dismissAll();
}
