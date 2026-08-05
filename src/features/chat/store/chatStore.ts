import { create } from 'zustand';
import type { OnboardingCharacterId } from '@/constants/characters';
import type { ChatMessage, ChatMessageType, SseCrisisResource } from '@/types/chat';

export type SessionPhase = 'idle' | 'active' | 'ended';

interface ChatState {
  sessionPhase: SessionPhase;
  sessionId: string | null;
  // 새 세션 시작 시점의 last_ended_session_id — 세션 요약 화면에서 직전 세션과의 감정 변화율 계산용
  previousSessionId: string | null;
  characterId: OnboardingCharacterId;
  messages: ChatMessage[];
  streamingMessageId: string | null;
  isAiTyping: boolean;
  emotionScoringActive: boolean;
  pendingEmotionScore: number;
  // 활성화된 슬라이더를 어떤 CBT reconstruction에 제출할지 — done 이벤트의 emotion_score_target_id
  emotionScoreTargetId: string | null;
  // messages[]는 persist가 없어 앱을 껐다 켜면 비므로, 활성 세션 복귀 시 서버가 알려준 메시지 수로
  // message_index를 시드한다. 안 하면 재시작 유저의 대화가 영영 index 0으로만 찍혀
  // "유의미 대화"(index ≥ 1) 판정이 성립하지 않는다
  sentMessageIndexSeed: { sessionId: string; value: number } | null;
  // 이번 실행에서 이 세션으로 보낸 사용자 메시지 수
  sentMessageCount: number;
}

interface ChatActions {
  startSession: (
    sessionId: string,
    characterId: OnboardingCharacterId,
    previousSessionId?: string | null
  ) => void;
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
  setSentMessageIndexSeed: (sessionId: string, value: number) => void;
  /** 다음에 보낼 메시지의 message_index (아직 확정하지 않는다) */
  peekNextSentMessageIndex: (sessionId: string) => number;
  /** 전송이 실제로 이뤄진 턴에서만 호출해 index를 소비한다 */
  commitSentMessage: () => void;
  reset: () => void;
}

const initialState: ChatState = {
  sessionPhase: 'idle',
  sessionId: null,
  previousSessionId: null,
  // 세션 시작 전엔 아무도 이 기본값을 읽지 않음(SessionStart는 useSelectedCharacterId() 사용) —
  // startSession() 호출 시 서버 응답(character_id)으로 즉시 덮어써짐
  characterId: 'mio',
  messages: [],
  streamingMessageId: null,
  isAiTyping: false,
  emotionScoringActive: false,
  pendingEmotionScore: 50,
  emotionScoreTargetId: null,
  sentMessageIndexSeed: null,
  sentMessageCount: 0,
};

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  ...initialState,

  startSession: (sessionId, characterId, previousSessionId = null) =>
    set((state) => ({
      ...initialState,
      // 같은 세션의 시드는 유지한다 — 활성 세션 재조회로 먼저 들어온 시드를 startSession이 지우면
      // 재시작 복귀 케이스에서 index가 다시 0부터 매겨진다
      sentMessageIndexSeed:
        state.sentMessageIndexSeed?.sessionId === sessionId ? state.sentMessageIndexSeed : null,
      sessionPhase: 'active',
      sessionId,
      characterId,
      previousSessionId,
    })),

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

  setSentMessageIndexSeed: (sessionId, value) =>
    set((state) =>
      state.sentMessageIndexSeed?.sessionId === sessionId
        ? state
        : { sentMessageIndexSeed: { sessionId, value } }
    ),

  peekNextSentMessageIndex: (sessionId) => {
    const { sentMessageIndexSeed, sentMessageCount } = get();
    const seed = sentMessageIndexSeed?.sessionId === sessionId ? sentMessageIndexSeed.value : 0;
    return seed + sentMessageCount;
  },

  commitSentMessage: () => set((state) => ({ sentMessageCount: state.sentMessageCount + 1 })),

  reset: () => set(initialState),
}));
