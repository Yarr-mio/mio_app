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
};

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  ...initialState,

  startSession: (sessionId, characterId, previousSessionId = null) =>
    set({
      ...initialState,
      sessionPhase: 'active',
      sessionId,
      characterId,
      previousSessionId,
    }),

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
