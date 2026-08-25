import { useChatStore } from '@/features/chat/store/chatStore';

/**
 * 이번 실행에서 시작한 세션이고 사용자 메시지가 한 건도 없으면 `true`.
 *
 * 요약 생성이 영구 실패(410)했을 때 "안내 없이 시작 화면으로 돌려보낼지, 실패를 알리고 돌려보낼지"를
 * 가르는 판단에 쓴다.
 *
 * ⚠️ `sessionOrigin === 'created'` 조건을 빼면 안 된다 — 재진입 세션은 이력 복원이 실패했을 때도
 * `messages`가 비어 있어, 실제로는 대화가 있었던 세션을 무입력으로 오판한다.
 * ⚠️ 스토어가 다른 세션을 들고 있으면(앱 재시작 후 재진입 등) 판별할 근거 자체가 없으므로 `false`다 —
 * 긴 대화 뒤에 아무 설명 없이 화면이 바뀌는 것보다 안내를 한 번 더 보여주는 쪽이 낫다.
 */
export function isSessionWithoutUserMessage(sessionId: string): boolean {
  const { sessionId: storeSessionId, sessionOrigin, messages } = useChatStore.getState();

  if (storeSessionId !== sessionId || sessionOrigin !== 'created') {
    return false;
  }

  return !messages.some((message) => message.role === 'user');
}
