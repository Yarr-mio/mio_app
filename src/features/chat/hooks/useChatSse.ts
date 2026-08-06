import { commitSentMessage, peekNextMessageIndex } from '@/analytics/chatMessageIndex';
import { track } from '@/analytics/track';
import { refreshAccessTokenForNonAxios } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { useChatStore } from '@/features/chat/store/chatStore';
import {
  API_BASE_URL,
  AUTH_API_ERROR_CODE,
  HTTP_STATUS,
  SSE_STREAM_SAFETY_TIMEOUT_MS,
} from '@/constants/config';
import { useAuthStore } from '@/store/authStore';
import type {
  SseCrisisData,
  SseDeltaData,
  SseDeltaReplaceData,
  SseDoneData,
  SseSessionMetaData,
} from '@/types/chat';
import { readErrorCodeFromBody } from '@/utils/readApiError';
import { useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
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
  // 이번 턴에 수신한 done 데이터 — chat_message_sent의 대화 품질 4필드 원천.
  // consumeStream의 반환 계약을 바꾸지 않고 값을 꺼내기 위한 계측 전용 통로다
  const lastDoneRef = useRef<SseDoneData | null>(null);
  const queryClient = useQueryClient();

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

    store.addMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      type: 'normal',
      content,
      timestamp: new Date().toISOString(),
    });

    store.setAiTyping(true);
    setIsStreaming(true);
    void performSendMessage(sessionId, content);
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
    // placeholder는 여기서 추가되지만, 콘텐츠가 빈 동안은 ChatMain에서 렌더링 제외됨 —
    // 실제 콘텐츠가 도착할 때(handleDelta/handleDeltaReplace/handleCrisis)까지 TypingIndicator를 유지한다
    useChatStore.setState({ streamingMessageId: placeholderId });
  }

  function handleDelta(data: SseDeltaData) {
    const store = useChatStore.getState();
    store.confirmStreamingMessageId(data.msg_id);
    store.appendDelta(data.msg_id, data.chunk);
    store.setAiTyping(false);
  }

  // append가 아니라 통째로 교체 — 지금까지 쌓인 delta.chunk를 버리고 safe_response로 다시 그림
  function handleDeltaReplace(data: SseDeltaReplaceData) {
    const store = useChatStore.getState();
    store.confirmStreamingMessageId(data.msg_id);
    store.replaceMessageContent(data.msg_id, data.safe_response);
    store.setAiTyping(false);
  }

  function handleCrisis(data: SseCrisisData) {
    // severity 1은 resources가 null (핫라인 없는 진정 유도 문구만)
    const store = useChatStore.getState();
    store.setAiTyping(false);
    const pendingId = store.streamingMessageId;
    const pendingMessage = pendingId
      ? store.messages.find((msg) => msg.id === pendingId)
      : undefined;

    // delta 없이 곧장 crisis로 끝나는 경로(입력단계 즉시 위기 감지, BUFFER 출력단계 위기 전환)에서는
    // session_meta가 만든 빈 placeholder가 안 채워진 채 남아 위기 말풍선과 중복 표시되므로, 새 메시지를
    // 추가하는 대신 그 placeholder를 위기 말풍선으로 전환한다
    if (pendingId && pendingMessage && pendingMessage.content === '') {
      store.replaceMessageAsCrisis(pendingId, data.fixed_response, data.resources?.hotlines);
      return;
    }

    store.addMessage({
      id: `crisis-${Date.now()}`,
      role: 'ai',
      type: 'crisis',
      content: data.fixed_response,
      timestamp: new Date().toISOString(),
      crisisResources: data.resources?.hotlines,
    });
  }

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

    if (data.is_socratic) {
      useChatStore.getState().setMessageType(data.msg_id, 'socratic');
    }

    // 소크라테스 CBT 개입이 실제로 끝난 턴에서만 슬라이더를 띄운다 — emotion_score_target_id가 없으면
    // requires_emotion_score 값과 무관하게 띄우지 않음(reconstruction row 생성 실패 케이스 방어)
    if (
      data.finished_reason === 'stop' &&
      data.cbt_intervention_state === 'completed' &&
      data.requires_emotion_score &&
      data.emotion_score_target_id !== null
    ) {
      useChatStore
        .getState()
        .activateEmotionScoring(data.emotion_score ?? 50, data.emotion_score_target_id);
    }
    if (data.is_crisis_flagged && data.finished_reason === 'replaced_by_guard') {
      handleCrisisFallback();
    }
    // crisis_flow를 받아도 서버는 세션을 종료하지 않음 — 세션은 active로 유지하고 대화를 계속할 수 있어야 함
  }

  // 동기 검증 실패(SSE_SPEC.md §2-1) — 스트림이 열리기 전에 JSON ErrorResponse로 즉시 응답됨
  function handleSyncValidationError(status: number, currentSessionId: string) {
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
      // 30분 무응답 자동 종료 등으로 서버가 클라이언트도 모르게 세션을 먼저 끝낸 경우 — 클라이언트
      // 세션도 종료 처리하고, activeSession 캐시를 무효화한 뒤 곧장 요약 화면으로 이동시켜
      // chat/index.tsx가 빈 화면에 멈춰버리는 막다른 길(sessionPhase==='ended'만 보고 전환을 가정)을 막는다
      useChatStore.getState().endSession();
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.activeSession() });
      Alert.alert('대화가 이미 종료됐어요', '대화 요약을 확인해 주세요.');
      router.push({ pathname: '/(main)/chat/summary', params: { sessionId: currentSessionId } });
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
              lastDoneRef.current = parsed.data as SseDoneData;
              receivedDone = true;
              break;
          }
          // 한 번의 read()에 SSE 블록이 몰려서 오면 매 블록마다 동기적으로 store.set()이 일어나
          // React가 한 틱 안에서 50회 넘는 중첩 렌더를 처리하다 "Maximum update depth exceeded"로
          // 죽을 수 있다 — 블록 처리마다 매크로태스크로 양보해 React가 커밋을 끝낼 시간을 준다
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        separatorIndex = buffer.indexOf('\n\n');
      }
    }

    return receivedDone;
  }

  async function performSendMessage(currentSessionId: string, content: string) {
    // 전송 시점에 캡처한다 — done 계열 4필드는 응답 스트림이 끝날 때 도착하므로, 이 턴의 이벤트는
    // done 수신 / 스트림 종료 / abort 어디로 끝나든 finally에서 정확히 1건만 발행한다.
    // PR #55의 401 재시도는 while 루프로 이 함수 안쪽에 있어 finally가 메시지당 1회만 실행된다
    const messageIndex = peekNextMessageIndex(currentSessionId);
    const charCount = content.length;
    // 서버가 메시지를 받지 못한 경로에서는 발행하지 않는다 — 발행하면 활성화율이 부푼다
    let shouldTrackSend = true;

    const controller = new AbortController();
    abortRef.current = controller;
    let timedOut = false;
    const safetyTimeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, SSE_STREAM_SAFETY_TIMEOUT_MS);

    // 인증 재시도용 동일 Idempotency-Key
    const idempotencyKey = Crypto.randomUUID();
    let accessToken = useAuthStore.getState().accessToken;
    let hasRetriedAuth = false;
    let authRefreshFailed = false;

    try {
      while (true) {
        const res = await fetch(`${API_BASE_URL}/v1/sessions/${currentSessionId}/messages`, {
          method: 'POST',
          headers: {
            Accept: 'text/event-stream',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ content }),
          signal: controller.signal,
        });

        const contentType = res.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          // AUTH_TOKEN_EXPIRED 시 refresh 후 전송 1회 재시도
          if (res.status === HTTP_STATUS.UNAUTHORIZED && !hasRetriedAuth) {
            let errorBody: unknown = null;
            try {
              errorBody = await res.json();
            } catch {
              errorBody = null;
            }

            if (readErrorCodeFromBody(errorBody) === AUTH_API_ERROR_CODE.TOKEN_EXPIRED) {
              hasRetriedAuth = true;
              try {
                accessToken = await refreshAccessTokenForNonAxios();
              } catch (refreshError) {
                authRefreshFailed = true;
                shouldTrackSend = false;
                throw refreshError;
              }
              continue;
            }
          }

          shouldTrackSend = false;
          resetStreamingState();
          handleSyncValidationError(res.status, currentSessionId);
          return;
        }

        if (!res.body) {
          throw new Error('SSE 응답 스트림이 비어 있음');
        }

        const receivedDone = await consumeStream(res.body.getReader());
        if (!receivedDone) {
          // done 미수신 시 타임아웃 또는 연결 끊김 처리
          resetStreamingState();
          Alert.alert('전송 실패', '응답을 받는 데 문제가 생겼어요. 다시 시도해 주세요.');
        }
        return;
      }
    } catch (error) {
      if (controller.signal.aborted && !timedOut) {
        // 화면 이탈/언마운트로 인한 의도된 취소 — 쌓인 부분 응답은 그대로 두고 에러 표시 없음
        return;
      }
      // catch가 에러를 삼켜 실제 원인(네트워크 실패/타임아웃/핸들러 예외)을 구분할 수 없었던 문제 — 원인 파악을 위해 로그를 남긴다
      console.error('[ChatSSE] performSendMessage failed:', { timedOut, error });
      resetStreamingState();
      // refresh 실패 시 인증 정리 후 전송 실패 Alert 생략
      if (authRefreshFailed) {
        return;
      }
      Alert.alert(
        '전송 실패',
        '메시지를 보내는 데 문제가 생겼어요. 네트워크 상태를 확인해 주세요.'
      );
    } finally {
      clearTimeout(safetyTimeout);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }

      if (shouldTrackSend) {
        commitSentMessage(currentSessionId);
        // done을 못 받았으면 대화 품질 4필드는 null로 둔다 — 결손을 0/false로 감추지 않는다
        const doneData = lastDoneRef.current;
        track('chat_message_sent', {
          chat_session_id: currentSessionId,
          message_index: messageIndex,
          char_count: charCount,
          ai_emotion_score: doneData?.emotion_score ?? null,
          is_socratic: doneData?.is_socratic ?? null,
          cbt_intervention_state: doneData?.cbt_intervention_state ?? null,
          is_crisis_flagged: doneData?.is_crisis_flagged ?? null,
        });
      }

      // 읽은 뒤 비운다 — 다음 턴이 done을 못 받았을 때 이번 턴의 값이 새어 들어가면 안 된다
      lastDoneRef.current = null;
    }
  }

  return { sendMessage, isStreaming };
}
