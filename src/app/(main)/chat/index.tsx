import { useIsFocused } from '@react-navigation/native';
import { useEffect } from 'react';
import { View } from 'react-native';
import { ChatBackground } from '@/components/themed/ChatBackground';
import { useActiveSession } from '@/features/chat/hooks/useChat';
import { useChatStore } from '@/features/chat/store/chatStore';
import { SessionStart } from '@/features/chat/components/SessionStart';
import { ChatMain } from '@/features/chat/components/ChatMain';
import {
  pushSessionSummaryOnce,
  releaseSessionSummaryNavigation,
} from '@/features/chat/services/sessionSummaryNavigation';
import { storage } from '@/utils/storage';

export default function ChatScreen() {
  const { data: activeSession, isLoading } = useActiveSession();
  const isFocused = useIsFocused();
  const sessionPhase = useChatStore((s) => s.sessionPhase);
  const sessionId = useChatStore((s) => s.sessionId);
  const startSession = useChatStore((s) => s.startSession);
  const endSession = useChatStore((s) => s.endSession);
  const reset = useChatStore((s) => s.reset);

  useEffect(() => {
    if (!activeSession) return;

    if (activeSession.session_id && activeSession.character_id) {
      // 스토어가 이미 이 세션을 아는 상태면 재시작하지 않는다 — 'active'는 재조회로 인한 스토어
      // 리셋 방지, 'ended'는 요약으로 넘어가는 중인 세션을 (invalidate 직후에도 남아있는) 옛
      // activeSession 캐시로 되살리는 것 방지. startSession()은 콜드 스타트나 세션이 실제로
      // 바뀐 경우에만 호출한다
      if (sessionId === activeSession.session_id) {
        return;
      }
      // 재진입 경로에서는 인사말을 직접 넣지 않는다 — 오프닝은 서버 이력의 첫 항목이라
      // 대화 이력 복원이 나머지 대화와 함께 가져온다 (origin 기본값 'resumed'가 그 조회를 연다)
      startSession(activeSession.session_id, activeSession.character_id);
      return;
    }

    const endedSessionId = activeSession.last_ended_session_id;
    const summaryStatus = activeSession.last_summary_status;

    // 방금 시작한 세션은 아직 이 응답에 반영돼 있지 않다 — 세션 생성은 activeSession 캐시를
    // 무효화하지 않으므로, 스토어가 들고 있는 활성 세션이 여기서 말하는 종료 세션이 아니라면
    // 이 응답 전체가 낡은 것이다. 아래의 정리·리다이렉트를 그대로 태우면 살아 있는 새 세션을
    // 리셋하거나(대화 화면이 시작 화면으로 되돌아감) 그 위로 요약 화면을 덮어쓴다
    if (sessionPhase === 'active' && sessionId !== endedSessionId) {
      return;
    }

    // 서버가 이미 이 세션을 끝냈는데 로컬 스토어는 여전히 active로 남아있는 경우 정리 —
    // 그래야 요약 확인 후 복귀 시 죽은 세션이 아니라 SessionStart가 보인다
    if (sessionPhase === 'active' && endedSessionId && sessionId === endedSessionId) {
      endSession();
    }

    if (!endedSessionId || !summaryStatus || summaryStatus === 'viewed') {
      return;
    }

    // 'failed'는 서버가 요약을 FAILED로 확정한 상태 — 요약 화면으로 보내봐야 GET .../summary가 410으로
    // 떨어져 대기 화면에 고착된다(API 명세도 done일 때만 요약으로 유도하라고 규정한다).
    // 여기서 reset()을 빠뜨리면 sessionPhase가 'ended'로 남아 이 화면이 아래 빈 배경으로 굳는다 —
    // 리다이렉트를 막는 것과 phase를 되돌리는 것은 한 세트다
    if (summaryStatus === 'failed') {
      // 되돌릴 대상은 "요약으로 넘어가려던 그 세션"뿐이다 — 대상을 특정하지 않으면 무관한 세션까지
      // 리셋한다(위 endSession() 블록이 같은 이유로 sessionId를 대조한다)
      if (isFocused && sessionPhase !== 'idle' && sessionId === endedSessionId) {
        reset();
      }
      return;
    }

    // 요약으로 보낸 줄 알았던 세션인데 이 화면이 포커스를 잡고 있다 = 요약 화면이 스택에서 사라졌다는
    // 뜻이다(덮여 있는 동안에는 마운트돼 있어도 포커스가 없다). 아래 'ended' 분기가 빈 배경만 그리는
    // 막다른 길이므로 이동 claim을 풀어 다시 보낼 수 있게 한다. 정상 이탈(SessionEnd → dismissAll →
    // 홈)은 탭이 함께 바뀌어 이 화면이 포커스를 얻지 못하고, reset()으로 phase도 'idle'이라 걸리지 않는다.
    // 해제를 await 앞에 두는 것이 중요하다 — 뒤로 옮기면 동시에 도는 effect 둘이 각자 push할 수 있다
    if (isFocused && sessionPhase === 'ended') {
      releaseSessionSummaryNavigation(endedSessionId);
    }

    void (async () => {
      // summary_status가 viewed로 전환되는 시점이 불명확해, 서버 상태와 무관하게 같은 세션으로는
      // 한 번만 리다이렉트하도록 로컬에 마지막으로 보여준 세션 id를 기록해둔다
      const lastRedirectedSessionId = await storage.chatRedirectedSessionId.get();
      if (lastRedirectedSessionId === endedSessionId) return;

      // 종료 플로우가 이번 실행에서 이미 이 세션의 요약으로 보냈다면 화면을 겹쳐 쌓지 않는다.
      // 영속 가드는 리다이렉트가 실제로 push했을 때만 기록해야 한다 — 요약을 못 본 채 앱을 죽인
      // 사용자를 재실행 시 구제하는 경로가 이 기록에 막히면 안 된다
      if (!pushSessionSummaryOnce(endedSessionId)) return;

      await storage.chatRedirectedSessionId.set(endedSessionId);
    })();
  }, [activeSession, sessionPhase, sessionId, isFocused, startSession, endSession, reset]);

  // sessionPhase가 'ended'인 동안은 요약 화면으로 전환 중인 과도기 상태 — 이 화면이 잠깐이라도
  // 보이면(전환 애니메이션, 뒤로 스와이프 등) "대화 시작하기" 화면이 깜빡이지 않도록 빈 배경만 보여준다
  if (isLoading || sessionPhase === 'ended') {
    return (
      <View className="flex-1 bg-midnight">
        <ChatBackground />
      </View>
    );
  }

  if (sessionPhase === 'active') {
    return <ChatMain />;
  }

  return <SessionStart />;
}
