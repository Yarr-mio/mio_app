/**
 * `session_summary_viewed` 중복 발행 가드 (event-logging-spec v3.5 §4)
 *
 * 이 이벤트만 §3-B 뒷단 중복 제거 대상이 아니다 — 부푼 값이 그대로 Core Action 건수가 되므로
 * 발행 측이 유일한 방어선이다.
 *
 * ⚠️ 가드를 컴포넌트의 `useRef`에 두면 안 된다. ref는 인스턴스마다 따로 존재해서 요약 화면이
 * 두 번 마운트되면(요약으로 가는 `router.push`가 `useChat.ts`·`useChatSse.ts` 두 곳이다) 각
 * 인스턴스가 자기 ref만 보고 1건씩 발행한다. 실기기 검증에서 한 번의 화면 진입에 2건이 나갔고
 * 다른 날·다른 세션에서도 그대로 재현됐다.
 *
 * ⚠️ 계측 상태를 `chatStore`에 넣지 않는다 — 계측은 계측 안에서 닫는다(`chatMessageIndex.ts`와 동일).
 */

/** 이미 조회 이벤트를 발행한 채팅 세션 id */
const viewedSessionIds = new Set<string>();

/**
 * 이 세션의 요약 조회를 아직 발행하지 않았으면 `true`를 돌려주고 소비한다.
 *
 * 같은 세션의 요약을 의도적으로 다시 열어도 1건으로 접힌다. 현 계약은 `chat_session_id`만
 * 싣고 열람 횟수를 요구하지 않으므로 손실이 없다.
 */
export function claimSummaryView(sessionId: string): boolean {
  if (viewedSessionIds.has(sessionId)) {
    return false;
  }

  viewedSessionIds.add(sessionId);
  return true;
}
