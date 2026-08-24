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
  });

  useEffect(() => {
    if (!sessionId || !query.data) return;
    // 최종 적용 가드는 스토어 안에 있다 — 여기 도착 시점과 set() 시점 사이에도 상태가 바뀔 수 있다
    useChatStore.getState().restoreMessages(sessionId, toRestoredChatMessages(query.data));
  }, [sessionId, query.data]);

  return {
    isRestoring: shouldRestore && query.isFetching,
    // 이미 대화가 있으면(사용자가 먼저 말을 걸었거나 복원이 끝났으면) 실패 배너를 접는다
    isRestoreFailed: query.isError && !hasMessages,
    retryRestore: () => void query.refetch(),
  };
}
