import { useChatStore } from '@/features/chat/store/chatStore';
import type { SseCrisisData, SseDeltaData, SseDoneData, SseSessionMetaData } from '@/types/chat';
import { useEffect, useRef, useState } from 'react';

// TODO: SSE 재연결 전략 미구현 (네트워크 끊김 대응 필요)

function parseSSELine(line: string): { event: string; data: unknown } | null {
  if (!line.startsWith('data:')) return null;
  try {
    return JSON.parse(line.slice(5).trim());
  } catch {
    return null;
  }
}

export function useChatSse(sessionId: string | null) {
  const [isStreaming, setIsStreaming] = useState(false);
  // 실제 SSE 연동 시 진행 중인 fetch 요청을 취소할 AbortController 보관용 (현재는 mock이라 미할당)
  const abortRef = useRef<AbortController | null>(null);
  // 소크라테스 질문에 대한 텍스트 답변 전송 직후 → 감정 강도 슬라이드 노출 → 슬라이드 확인 시점에 응답 전송
  const awaitingSocraticScoreRef = useRef(false);
  const mockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 언마운트/세션 전환 시 mock 타이머가 남아 새 세션의 store에 응답을 흘려보내는 것을 방지
  useEffect(() => {
    return () => {
      if (mockTimeoutRef.current) clearTimeout(mockTimeoutRef.current);
      if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
      // 언마운트 시점의 최신 컨트롤러를 취소해야 하므로 ref를 그대로 읽는다 (값 복사 시 abort 무력화됨)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      abortRef.current?.abort();
    };
  }, []);

  function sendMessage(content: string) {
    if (!sessionId || isStreaming) return;

    const store = useChatStore.getState();
    const lastMessage = store.messages[store.messages.length - 1];
    const isSocraticReply = lastMessage?.role === 'ai' && lastMessage.type === 'socratic';

    store.addMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      type: 'normal',
      content,
      timestamp: new Date().toISOString(),
    });

    if (isSocraticReply) {
      awaitingSocraticScoreRef.current = true;
      store.activateEmotionScoring(50);
      return;
    }

    store.setAiTyping(true);
    setIsStreaming(true);

    // TODO: 서버 연동 전 mock 응답 사용
    runMock();
  }

  function confirmEmotionScore(score: number) {
    const store = useChatStore.getState();
    store.deactivateEmotionScoring();

    if (awaitingSocraticScoreRef.current) {
      awaitingSocraticScoreRef.current = false;
      // TODO: 점수 제출 엔드포인트 미명세 — 백엔드 확인 필요. 현재는 텍스트 답변 + 감정 점수를 함께 제출했다고 가정하고
      // 소크라테스식 답변에 어울리는 mock 응답을 트리거 (일반 답변용 mockText와 분리)
      void score;
      store.setAiTyping(true);
      setIsStreaming(true);
      runMock(
        '그렇게 느끼고 계셨군요. 그 감정을 알아차린 것만으로도 의미 있는 한 걸음이에요. 잠시 그 마음에 함께 머물러볼까요?'
      );
    }
  }

  // TODO: 서버 연동 시 아래 mock을 실제 SSE fetch로 교체
  // 실제 구현 참고:
  //   const controller = new AbortController();
  //   abortRef.current = controller;
  //   const res = await fetch(`/v1/sessions/${sessionId}/messages`, {
  //     method: 'POST',
  //     headers: { Accept: 'text/event-stream', 'Idempotency-Key': crypto.randomUUID() },
  //     body: JSON.stringify({ content }),
  //     signal: controller.signal,
  //   });
  //   const reader = res.body?.getReader();
  //   ... ReadableStream 청크 파싱 후 아래 핸들러 호출

  // data.message_id는 inboundMsgId(사용자 메시지 ack)일 뿐 AI 메시지 id가 아니다 — 아직 모르는
  // outboundMsgId 대신 placeholder id로 빈 AI 메시지를 추적하고, 최초 delta 수신 시 확정한다
  function handleSessionMeta(data: SseSessionMetaData) {
    const placeholderId = `pending-ai-${data.message_id}`;
    const store = useChatStore.getState();
    store.addMessage({
      id: placeholderId,
      role: 'ai',
      type: 'normal',
      content: '',
      timestamp: data.received_at,
    });
    // 빈 AI 메시지가 추가되는 순간 TypingIndicator 숨김 — delta가 이어받음
    store.setAiTyping(false);
    useChatStore.setState({ streamingMessageId: placeholderId });
  }

  function handleDelta(data: SseDeltaData) {
    const store = useChatStore.getState();
    store.confirmStreamingMessageId(data.msg_id);
    store.appendDelta(data.msg_id, data.chunk);
  }

  // TODO: 백엔드 명세가 확실해지면 연동
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleCrisis(data: SseCrisisData) {
    useChatStore.getState().addMessage({
      id: `crisis-${Date.now()}`,
      role: 'ai',
      type: 'crisis',
      content: data.fixed_response,
      timestamp: new Date().toISOString(),
      crisisResources: data.resources.hotlines,
    });
  }

  function handleDone(data: SseDoneData) {
    const store = useChatStore.getState();
    store.setAiTyping(false);
    useChatStore.setState({ streamingMessageId: null });
    setIsStreaming(false);

    if (data.emotion_score !== null) {
      store.activateEmotionScoring(data.emotion_score);
    }
    if (data.finished_reason === 'crisis_flow') {
      store.endSession();
    }
  }

  function runMock(
    mockText: string = '말씀 잘 들었어요. 그 상황에서 어떤 감정이 가장 크게 느껴졌나요?'
  ) {
    // 실서버처럼 inboundMsgId(사용자 메시지)와 outboundMsgId(AI 메시지)를 다른 값으로 발급
    const inboundMsgId = `msg_in_mock_${Date.now()}`;
    const outboundMsgId = `msg_out_mock_${Date.now()}`;

    mockTimeoutRef.current = setTimeout(() => {
      handleSessionMeta({ message_id: inboundMsgId, received_at: new Date().toISOString() });

      let i = 0;
      mockIntervalRef.current = setInterval(() => {
        if (i < mockText.length) {
          handleDelta({ msg_id: outboundMsgId, chunk: mockText[i] });
          i++;
        } else {
          if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
          mockIntervalRef.current = null;
          handleDone({
            msg_id: outboundMsgId,
            emotion_score: null,
            is_crisis_flagged: false,
            finished_reason: 'stop',
          });
        }
      }, 40);
    }, 600);
  }

  // 사용되지 않지만 eslint warning 방지 및 향후 실제 연동 시 활용
  void parseSSELine;
  void abortRef;

  return { sendMessage, confirmEmotionScore, isStreaming };
}
