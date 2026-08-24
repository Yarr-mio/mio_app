import { create } from 'zustand';
import type { OnboardingCharacterId } from '@/constants/characters';
import type { ChatMessage, ChatMessageType, SseCrisisResource } from '@/types/chat';

export type SessionPhase = 'idle' | 'active' | 'ended';

// 이 세션을 이번 실행에서 새로 만들었는지(created), 이미 있던 세션에 다시 들어온 건지(resumed).
// 이력 복원이 "재진입한 세션만 조회"를 판정하는 근거다 — 신규 세션은 서버에도 오프닝 1건뿐이라
// 조회할 이유가 없고, BE #428 미배포로 오프닝이 비어 있어도 조회가 새어나가지 않게 한다
export type SessionOrigin = 'created' | 'resumed';

interface StartSessionOptions {
  previousSessionId?: string | null;
  openingMessage?: ChatMessage | null;
  origin?: SessionOrigin;
}

interface ChatState {
  sessionPhase: SessionPhase;
  sessionId: string | null;
  // 새 세션 시작 시점의 last_ended_session_id — 세션 요약 화면에서 직전 세션과의 감정 변화율 계산용
  previousSessionId: string | null;
  characterId: OnboardingCharacterId;
  sessionOrigin: SessionOrigin;
  messages: ChatMessage[];
  streamingMessageId: string | null;
  isAiTyping: boolean;
  emotionScoringActive: boolean;
  pendingEmotionScore: number;
  // 활성화된 슬라이더를 어떤 CBT reconstruction에 제출할지 — done 이벤트의 emotion_score_target_id
  emotionScoreTargetId: string | null;
}

interface ChatActions {
  startSession: (
    sessionId: string,
    characterId: OnboardingCharacterId,
    options?: StartSessionOptions
  ) => void;
  restoreMessages: (sessionId: string, messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  appendDelta: (msgId: string, chunk: string) => void;
  replaceMessageContent: (msgId: string, content: string) => void;
  replaceMessageAsCrisis: (
    msgId: string,
    content: string,
    crisisResources?: SseCrisisResource[]
  ) => void;
  confirmStreamingMessageId: (outboundMsgId: string) => void;
  setMessageType: (msgId: string, type: ChatMessageType) => void;
  setAiTyping: (value: boolean) => void;
  activateEmotionScoring: (initialScore: number, targetId: string) => void;
  setPendingEmotionScore: (score: number) => void;
  deactivateEmotionScoring: () => void;
  endSession: () => void;
  reset: () => void;
}

const initialState: ChatState = {
  sessionPhase: 'idle',
  sessionId: null,
  previousSessionId: null,
  // 세션 시작 전엔 아무도 이 기본값을 읽지 않음(SessionStart는 useSelectedCharacterId() 사용) —
  // startSession() 호출 시 서버 응답(character_id)으로 즉시 덮어써짐
  characterId: 'mio',
  // 기본값은 안전한 쪽(resumed) — 출처를 명시하지 않은 호출은 재진입으로 보고 이력 복원을 허용한다
  sessionOrigin: 'resumed',
  messages: [],
  streamingMessageId: null,
  isAiTyping: false,
  emotionScoringActive: false,
  pendingEmotionScore: 50,
  emotionScoreTargetId: null,
};

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  ...initialState,

  startSession: (sessionId, characterId, options) =>
    set({
      ...initialState,
      sessionPhase: 'active',
      sessionId,
      characterId,
      previousSessionId: options?.previousSessionId ?? null,
      sessionOrigin: options?.origin ?? 'resumed',
      // 리셋과 같은 set()에서 시딩한다 — 뒤이어 addMessage()로 넣으면 인사말 없는 중간 상태가
      // 한 번 그려지고, 중복 삽입 가드도 따로 필요해진다.
      // messages는 initialState에도 있으므로 반드시 스프레드 뒤에 와야 덮어써진다
      messages: options?.openingMessage ? [options.openingMessage] : [],
    }),

  // 이력 복원은 병합이 아니라 "전부 아니면 전무" 시딩이다 —
  // 로컬 사용자 메시지 id(`user-${Date.now()}`)는 서버 message_id와 겹치지 않아 중복 제거가
  // 성립하지 않는다. 또 응답이 늦게 도착하는 사이 상태가 바뀌었을 수 있으므로,
  // 적용 조건 검사를 set() 안에서 원자적으로 한다 (복원 중 전송 버튼 비활성화의 안전망)
  restoreMessages: (sessionId, messages) =>
    set((state) =>
      state.sessionId === sessionId && state.messages.length === 0 ? { messages } : {}
    ),

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  appendDelta: (msgId, chunk) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === msgId ? { ...msg, content: msg.content + chunk } : msg
      ),
    })),

  // delta.replace 전용 — 지금까지 누적된 content를 버리고 통째로 덮어쓴다 (append 아님)
  replaceMessageContent: (msgId, content) =>
    set((state) => ({
      messages: state.messages.map((msg) => (msg.id === msgId ? { ...msg, content } : msg)),
    })),

  // delta 없이 곧장 crisis로 끝나는 경로(입력단계 즉시 위기 감지, BUFFER 출력단계 위기 전환)에서
  // session_meta가 만든 빈 placeholder를 새 메시지 추가 없이 위기 말풍선으로 그대로 전환한다
  replaceMessageAsCrisis: (msgId, content, crisisResources) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === msgId ? { ...msg, type: 'crisis', content, crisisResources } : msg
      ),
    })),

  // session_meta 시점엔 outboundMsgId(AI 메시지 id)를 아직 몰라 placeholder id로 빈 AI 메시지를 추적하다가,
  // 최초 delta 수신 시 실제 outboundMsgId로 placeholder id를 확정한다 (placeholder === outboundMsgId면 스킵)
  confirmStreamingMessageId: (outboundMsgId) =>
    set((state) => {
      if (!state.streamingMessageId || state.streamingMessageId === outboundMsgId) {
        return state;
      }
      const placeholderId = state.streamingMessageId;
      return {
        streamingMessageId: outboundMsgId,
        messages: state.messages.map((msg) =>
          msg.id === placeholderId ? { ...msg, id: outboundMsgId } : msg
        ),
      };
    }),

  // is_socratic 판정(LLM 분류기)이 true인 턴의 AI 메시지를 'socratic'으로 마킹 — SocraticBubble 라벨용
  setMessageType: (msgId, type) =>
    set((state) => ({
      messages: state.messages.map((msg) => (msg.id === msgId ? { ...msg, type } : msg)),
    })),

  setAiTyping: (value) => set({ isAiTyping: value }),

  activateEmotionScoring: (initialScore, targetId) =>
    set({
      emotionScoringActive: true,
      pendingEmotionScore: initialScore,
      emotionScoreTargetId: targetId,
    }),

  setPendingEmotionScore: (score) => set({ pendingEmotionScore: score }),

  deactivateEmotionScoring: () =>
    set({ emotionScoringActive: false, streamingMessageId: null, emotionScoreTargetId: null }),

  endSession: () => set({ sessionPhase: 'ended', isAiTyping: false }),

  reset: () => set(initialState),
}));
