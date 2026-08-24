import { fetchAllSessionMessages } from '@/api/endpoints/chat';
import { queryKeys } from '@/api/queryKeys';
import { useChatStore } from '@/features/chat/store/chatStore';
import { toRestoredChatMessages } from '@/features/chat/utils/chatMessage';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * 재진입한 세션의 대화 이력을 서버에서 받아 `chatStore`에 한 번 시딩한다.
 *
 * `chatStore`는 순수 메모리라 프로세스가 죽으면 대화가 사라진다. 앱 재실행·콜드 스타트로
 * 진행 중이던 세션에 다시 들어왔을 때만 이력을 조회해 화면을 원래대로 돌려놓는다.
 */
export function useSessionMessages() {
  const sessionId = useChatStore((s) => s.sessionId);
  const sessionOrigin = useChatStore((s) => s.sessionOrigin);
  const hasMessages = useChatStore((s) => s.messages.length > 0);

  // 복원이 필요한 순간에만 조회한다:
  // - 이번 실행에서 만든 신규 세션(origin==='created')은 서버에도 오프닝 1건뿐이라 조회하지 않는다
  //   (오프닝은 POST /v1/sessions 응답으로 이미 시딩됐다 — BE #428 미배포로 비어 있어도 마찬가지)
  // - 대화 중 리렌더·포그라운드 복귀는 hasMessages=true라 조회하지 않는다.
  //   이 조건이 없으면 리렌더마다 이력을 다시 받으려 든다
  const shouldRestore = !!sessionId && sessionOrigin === 'resumed' && !hasMessages;

  const query = useQuery({
    queryKey: queryKeys.chat.sessionMessages(sessionId ?? 'none'),
    queryFn: () => fetchAllSessionMessages(sessionId as string),
    enabled: shouldRestore,
    // 한 번 복원하면 다시 받을 이유가 없다 — 이후 대화는 SSE가 스토어에 직접 쌓는다
    staleTime: Infinity,
    // 자동 재시도를 끈다 — 복원 중에는 입력창이 잠기므로, 전체 마감(SESSION_HISTORY_TOTAL_TIMEOUT_MS)이
    // 재시도 횟수만큼 곱해지면 상한이 무의미해진다. 실패는 즉시 배너로 넘겨 재시도 권한을 사용자에게 준다
    // (403/404처럼 재시도해도 결과가 같은 오류를 두 번 때리지 않는 효과도 있다)
    retry: false,
  });

  useEffect(() => {
    if (!sessionId || !query.data) return;
    // 최종 적용 가드는 스토어 안에 있다 — 여기 도착 시점과 set() 시점 사이에도 상태가 바뀔 수 있다
    useChatStore.getState().restoreMessages(sessionId, toRestoredChatMessages(query.data));
  }, [sessionId, query.data]);

  return {
    isRestoring: shouldRestore && query.isFetching,
    // 실패 사실은 사용자가 대화를 시작한 뒤에도 유지한다 — 여기서 접으면 "이력이 없는 것"과
    // "이력을 못 불러온 것"을 구분할 수단이 화면에서 사라진다(배너를 넣은 목적 자체)
    isRestoreFailed: query.isError,
    // 대화가 이미 시작됐으면 재시도해도 스토어의 "전부 아니면 전무" 가드에 막힌다 —
    // 눌러도 아무 일이 없는 버튼 대신 재시도 가능 여부를 호출부에 알려준다
    canRetryRestore: shouldRestore,
    retryRestore: () => void query.refetch(),
  };
}
