import { useRef, useState } from 'react';
import { useChatStore } from '@/features/chat/store/chatStore';
import type { SseCrisisData, SseDeltaData, SseDoneData, SseSessionMetaData } from '@/types/chat';

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
  const abortRef = useRef<AbortController | null>(null);

  function sendMessage(content: string) {
    if (!sessionId || isStreaming) return;

    const store = useChatStore.getState();

    store.addMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      type: 'normal',
      content,
      timestamp: new Date().toISOString(),
    });
    store.setAiTyping(true);
    setIsStreaming(true);

    // TODO: 서버 연동 전 mock 응답 사용
    runMock();
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

  function handleSessionMeta(data: SseSessionMetaData) {
    const aiMsgId = data.message_id;
    useChatStore.getState().addMessage({
      id: aiMsgId,
      role: 'ai',
      type: 'normal',
      content: '',
      timestamp: data.received_at,
    });
    useChatStore.setState({ streamingMessageId: aiMsgId });
  }

  function handleDelta(data: SseDeltaData) {
    useChatStore.getState().appendDelta(data.msg_id, data.chunk);
  }

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

  function runMock() {
    const metaId = `ai-${Date.now()}`;
    const mockText = '말씀 잘 들었어요. 그 상황에서 어떤 감정이 가장 크게 느껴졌나요?';

    setTimeout(() => {
      handleSessionMeta({ message_id: metaId, received_at: new Date().toISOString() });

      let i = 0;
      const interval = setInterval(() => {
        if (i < mockText.length) {
          handleDelta({ msg_id: metaId, chunk: mockText[i] });
          i++;
        } else {
          clearInterval(interval);
          handleDone({
            msg_id: metaId,
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

  return { sendMessage, isStreaming };
}
