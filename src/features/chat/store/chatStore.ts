import { create } from 'zustand';
import type { OnboardingCharacterId } from '@/constants/characters';
import type { ChatMessage, SseCrisisResource } from '@/types/chat';

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
  setAiTyping: (value: boolean) => void;
  activateEmotionScoring: (initialScore: number) => void;
  setPendingEmotionScore: (score: number) => void;
  deactivateEmotionScoring: () => void;
  endSession: () => void;
  reset: () => void;
}

const initialState: ChatState = {
  sessionPhase: 'idle',
  sessionId: null,
  previousSessionId: null,
  characterId: 'mio', // TODO: useCharacter() 훅으로 서버에서 수신 후 대체
  messages: [],
  streamingMessageId: null,
  isAiTyping: false,
  emotionScoringActive: false,
  pendingEmotionScore: 50,
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

  setAiTyping: (value) => set({ isAiTyping: value }),

  activateEmotionScoring: (initialScore) =>
    set({ emotionScoringActive: true, pendingEmotionScore: initialScore }),

  setPendingEmotionScore: (score) => set({ pendingEmotionScore: score }),

  deactivateEmotionScoring: () => set({ emotionScoringActive: false, streamingMessageId: null }),

  endSession: () => set({ sessionPhase: 'ended', isAiTyping: false }),

  reset: () => set(initialState),
}));
