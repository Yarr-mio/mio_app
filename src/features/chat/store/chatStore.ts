import { create } from 'zustand';
import type { OnboardingCharacterId } from '@/constants/characters';
import type { ChatMessage, ChatSummary } from '@/types/chat';

export type SessionPhase = 'idle' | 'active' | 'ended';

interface ChatState {
  sessionPhase: SessionPhase;
  sessionId: string | null;
  characterId: OnboardingCharacterId;
  messages: ChatMessage[];
  streamingMessageId: string | null;
  isAiTyping: boolean;
  emotionScoringActive: boolean;
  pendingEmotionScore: number;
  summary: ChatSummary | null;
}

interface ChatActions {
  startSession: (sessionId: string, characterId: OnboardingCharacterId) => void;
  addMessage: (message: ChatMessage) => void;
  appendDelta: (msgId: string, chunk: string) => void;
  confirmStreamingMessageId: (outboundMsgId: string) => void;
  setAiTyping: (value: boolean) => void;
  activateEmotionScoring: (initialScore: number) => void;
  setPendingEmotionScore: (score: number) => void;
  deactivateEmotionScoring: () => void;
  endSession: () => void;
  setSummary: (summary: ChatSummary) => void;
  reset: () => void;
}

const initialState: ChatState = {
  sessionPhase: 'idle',
  sessionId: null,
  characterId: 'mio', // TODO: useCharacter() 훅으로 서버에서 수신 후 대체
  messages: [],
  streamingMessageId: null,
  isAiTyping: false,
  emotionScoringActive: false,
  pendingEmotionScore: 50,
  summary: null,
};

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  ...initialState,

  startSession: (sessionId, characterId) =>
    set({
      ...initialState,
      sessionPhase: 'active',
      sessionId,
      characterId,
    }),

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  appendDelta: (msgId, chunk) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === msgId ? { ...msg, content: msg.content + chunk } : msg
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

  setSummary: (summary) => set({ summary }),

  reset: () => set(initialState),
}));
