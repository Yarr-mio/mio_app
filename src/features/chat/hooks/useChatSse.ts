import { useChatStore } from '@/features/chat/store/chatStore';
import { API_BASE_URL, SSE_STREAM_SAFETY_TIMEOUT_MS } from '@/constants/config';
import { useAuthStore } from '@/store/authStore';
import type {
  SseCrisisData,
  SseDeltaData,
  SseDeltaReplaceData,
  SseDoneData,
  SseSessionMetaData,
} from '@/types/chat';
import * as Crypto from 'expo-crypto';
// 글로벌 fetch는 RN에서 response.body.getReader() 스트리밍을 지원하지 않음 — expo/fetch는 WinterCG 호환 구현으로 스트리밍 지원
import { fetch } from 'expo/fetch';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

// TODO: SSE 재연결 전략 미구현 (네트워크 끊김 대응 필요)

// event:/data: 두 줄로 이뤄진 SSE 이벤트 블록(빈 줄로 구분된) 하나를 파싱
function parseSSELine(block: string): { event: string; data: unknown } | null {
  let event: string | null = null;
  let dataLine: string | null = null;

  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLine = line.slice('data:'.length).trim();
    }
  }

  if (!event || dataLine === null) return null;

  try {
    return { event, data: JSON.parse(dataLine) };
  } catch {
    return null;
  }
}

export function useChatSse(sessionId: string | null) {
  const [isStreaming, setIsStreaming] = useState(false);
  // 화면 이탈/언마운트 시 진행 중인 스트림을 취소하기 위해 보관
  const abortRef = useRef<AbortController | null>(null);

  // 언마운트/세션 전환 시 진행 중인 스트림 취소 — 쌓인 부분 응답은 롤백하지 않고 스토어에 그대로 둔다
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function resetStreamingState() {
    const store = useChatStore.getState();
    store.setAiTyping(false);
    useChatStore.setState({ streamingMessageId: null });
    setIsStreaming(false);
  }

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
      store.activateEmotionScoring(50);
      return;
    }

    store.setAiTyping(true);
    setIsStreaming(true);
    void performSendMessage(sessionId, content);
  }

  function confirmEmotionScore(_score: number) {
    // TODO: 백엔드 emotion-score 제출 엔드포인트 추가되면 연동 (CHAT_BACKEND_QUESTIONS §6)
    useChatStore.getState().deactivateEmotionScoring();
  }

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

  // append가 아니라 통째로 교체 — 지금까지 쌓인 delta.chunk를 버리고 safe_response로 다시 그림
  function handleDeltaReplace(data: SseDeltaReplaceData) {
    const store = useChatStore.getState();
    store.confirmStreamingMessageId(data.msg_id);
    store.replaceMessageContent(data.msg_id, data.safe_response);
  }

  function handleCrisis(data: SseCrisisData) {
    // severity 1은 resources가 null (핫라인 없는 진정 유도 문구만)
    useChatStore.getState().addMessage({
      id: `crisis-${Date.now()}`,
      role: 'ai',
      type: 'crisis',
      content: data.fixed_response,
      timestamp: new Date().toISOString(),
      crisisResources: data.resources?.hotlines,
    });
  }

  // CAUTIOUS_SPECULATIVE 경로에서 출력단계 위기 재분류 시 crisis 이벤트 없이 is_crisis_flagged만 옴
  // (CHAT_BACKEND_QUESTIONS §5에 백엔드 수정 요청해둠) — 응답 전까지 핫라인 번호 없는 fallback 안내로 대응
  function handleCrisisFallback() {
    useChatStore.getState().addMessage({
      id: `crisis-fallback-${Date.now()}`,
      role: 'ai',
      type: 'crisis',
      content: '지금 많이 힘든 마음이 느껴져요. 잠시 숨을 고르며 그 감정에 함께 머물러볼까요?',
      timestamp: new Date().toISOString(),
    });
  }

  function handleDone(data: SseDoneData) {
    resetStreamingState();

    if (typeof data.emotion_score === 'number') {
      useChatStore.getState().activateEmotionScoring(data.emotion_score);
    }
    if (data.is_crisis_flagged && data.finished_reason === 'replaced_by_guard') {
      handleCrisisFallback();
    }
    // crisis_flow를 받아도 서버는 세션을 종료하지 않음 — 세션은 active로 유지하고 대화를 계속할 수 있어야 함
  }

  // 동기 검증 실패(SSE_SPEC.md §2-1) — 스트림이 열리기 전에 JSON ErrorResponse로 즉시 응답됨
  function handleSyncValidationError(status: number) {
    if (status === 429) {
      Alert.alert(
        '잠시만 기다려 주세요',
        '메시지를 너무 빠르게 보내고 있어요. 잠시 후 다시 시도해 주세요.'
      );
      return;
    }
    if (status === 409) {
      Alert.alert('전송 실패', '같은 메시지가 이미 처리 중이에요. 잠시 후 다시 시도해 주세요.');
      return;
    }
    if (status === 404) {
      Alert.alert('대화를 찾을 수 없어요', '세션이 존재하지 않아요.');
      return;
    }
    if (status === 403) {
      Alert.alert('접근할 수 없어요', '이 대화에 접근할 권한이 없어요.');
      return;
    }
    if (status === 410) {
      // 세션이 이미 종료된 상태 — 서버 상태에 맞춰 클라이언트 세션도 종료 처리
      useChatStore.getState().endSession();
      Alert.alert('대화가 이미 종료됐어요', '대화 요약을 확인해 주세요.');
      return;
    }
    if (status === 400) {
      Alert.alert('전송 실패', '메시지 내용을 확인해 주세요.');
      return;
    }
    Alert.alert('전송 실패', '잠시 후 다시 시도해 주세요.');
  }

  // event:/data: 블록(빈 줄로 구분)을 모아 파싱하고 핸들러로 디스패치. done 이벤트 수신 여부를 반환
  async function consumeStream(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<boolean> {
    const decoder = new TextDecoder();
    let buffer = '';
    let receivedDone = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

      let separatorIndex = buffer.indexOf('\n\n');
      while (separatorIndex !== -1) {
        const block = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);

        const parsed = parseSSELine(block);
        if (parsed) {
          switch (parsed.event) {
            case 'session_meta':
              // 이벤트별 데이터 모양은 event 이름으로 서버가 보장 — 런타임 검증은 하지 않음
              handleSessionMeta(parsed.data as SseSessionMetaData);
              break;
            case 'delta':
              handleDelta(parsed.data as SseDeltaData);
              break;
            case 'delta.replace':
              handleDeltaReplace(parsed.data as SseDeltaReplaceData);
              break;
            case 'crisis':
              handleCrisis(parsed.data as SseCrisisData);
              break;
            case 'done':
              handleDone(parsed.data as SseDoneData);
              receivedDone = true;
              break;
          }
        }

        separatorIndex = buffer.indexOf('\n\n');
      }
    }

    return receivedDone;
  }

  async function performSendMessage(currentSessionId: string, content: string) {
    const controller = new AbortController();
    abortRef.current = controller;
    let timedOut = false;
    const safetyTimeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, SSE_STREAM_SAFETY_TIMEOUT_MS);

    try {
      const accessToken = useAuthStore.getState().accessToken;
      const res = await fetch(`${API_BASE_URL}/v1/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'Idempotency-Key': Crypto.randomUUID(),
        },
        body: JSON.stringify({ content }),
        signal: controller.signal,
      });

      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        resetStreamingState();
        handleSyncValidationError(res.status);
        return;
      }

      if (!res.body) {
        throw new Error('SSE 응답 스트림이 비어 있음');
      }

      const receivedDone = await consumeStream(res.body.getReader());
      if (!receivedDone) {
        // done 없이 스트림이 끝남 — 60초 타임아웃 또는 연결 끊김으로 간주 (SSE_SPEC.md §2-3, §2-4)
        resetStreamingState();
        Alert.alert('전송 실패', '응답을 받는 데 문제가 생겼어요. 다시 시도해 주세요.');
      }
    } catch {
      if (controller.signal.aborted && !timedOut) {
        // 화면 이탈/언마운트로 인한 의도된 취소 — 쌓인 부분 응답은 그대로 두고 에러 표시 없음
        return;
      }
      resetStreamingState();
      Alert.alert(
        '전송 실패',
        '메시지를 보내는 데 문제가 생겼어요. 네트워크 상태를 확인해 주세요.'
      );
    } finally {
      clearTimeout(safetyTimeout);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }

  return { sendMessage, confirmEmotionScore, isStreaming };
}
