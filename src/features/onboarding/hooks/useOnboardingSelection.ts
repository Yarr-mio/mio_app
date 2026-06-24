import type { OnboardingCharacterId } from '@/constants/characters';
import type { OnboardingConcernType, OnboardingStyleType } from '@/constants/onboarding';
import {
  ONBOARDING_DEFAULT_EMOJI_SCORE,
  ONBOARDING_INTENSITY_MAX,
  ONBOARDING_INTENSITY_MIN,
} from '@/constants/onboarding';
import { useUserStore } from '@/store/userStore';
import type { EmotionType } from '@/types/checkin';

function clampEmojiScore(score: number): number {
  return Math.max(ONBOARDING_INTENSITY_MIN, Math.min(ONBOARDING_INTENSITY_MAX, Math.round(score)));
}

export function useOnboardingSelection() {
  const onboardingResult = useUserStore((state) => state.onboardingResult);
  const patchOnboardingEmotion = useUserStore((state) => state.patchOnboardingEmotion);
  const clearOnboardingEmotion = useUserStore((state) => state.clearOnboardingEmotion);
  const patchOnboardingConcernTypes = useUserStore((state) => state.patchOnboardingConcernTypes);
  const clearOnboardingConcernTypes = useUserStore((state) => state.clearOnboardingConcernTypes);
  const patchOnboardingPreferredStyle = useUserStore(
    (state) => state.patchOnboardingPreferredStyle
  );
  const clearOnboardingPreferredStyle = useUserStore(
    (state) => state.clearOnboardingPreferredStyle
  );
  const patchOnboardingCharacterId = useUserStore((state) => state.patchOnboardingCharacterId);
  const clearOnboardingCharacterId = useUserStore((state) => state.clearOnboardingCharacterId);

  const emotion_state = onboardingResult?.emotionSelection?.emotion ?? null;
  const emoji_score = onboardingResult?.emotionSelection?.intensity ?? null;
  const concern_types = onboardingResult?.concernTypes ?? null;
  const preferred_style = onboardingResult?.preferredStyle ?? null;
  const character_id = onboardingResult?.characterId ?? null;

  const setEmotionState = (emotion: EmotionType | null) => {
    if (emotion === null) {
      clearOnboardingEmotion();
      return;
    }

    patchOnboardingEmotion(emotion, emoji_score ?? ONBOARDING_DEFAULT_EMOJI_SCORE);
  };

  const setEmojiScore = (score: number | null) => {
    if (emotion_state === null) {
      return;
    }

    if (score === null) {
      patchOnboardingEmotion(emotion_state, ONBOARDING_DEFAULT_EMOJI_SCORE);
      return;
    }

    patchOnboardingEmotion(emotion_state, clampEmojiScore(score));
  };

  const setConcernTypes = (types: OnboardingConcernType[] | null) => {
    if (types === null || types.length === 0) {
      clearOnboardingConcernTypes();
      return;
    }

    patchOnboardingConcernTypes(types);
  };

  const setPreferredStyle = (style: OnboardingStyleType | null) => {
    if (style === null) {
      clearOnboardingPreferredStyle();
      return;
    }

    patchOnboardingPreferredStyle(style);
  };

  const setCharacterId = (id: OnboardingCharacterId | null) => {
    if (id === null) {
      clearOnboardingCharacterId();
      return;
    }

    patchOnboardingCharacterId(id);
  };

  return {
    emotion_state,
    emoji_score,
    concern_types,
    preferred_style,
    character_id,
    setEmotionState,
    setEmojiScore,
    setConcernTypes,
    setPreferredStyle,
    setCharacterId,
  };
}
