import { track } from '@/analytics/track';
import { postOnboardingCharacter } from '@/api/endpoints/onboarding';
import type { OnboardingCharacterRequest, OnboardingCharacterResponse } from '@/types/onboarding';
import { useMutation } from '@tanstack/react-query';

export function useSignupCharacter() {
  return useMutation<OnboardingCharacterResponse, Error, OnboardingCharacterRequest>({
    mutationFn: (body) => postOnboardingCharacter(body),
    onSuccess: (res, variables) => {
      // CharacterSelectScreen은 선택해야만 「다음」 CTA를 노출하므로, 앱에서 출발한 요청은
      // 전부 명시 선택이다 → false 고정이 사실과 일치한다. 서버 자동 배정은 이 API를 호출하지
      // 않은 경우에만 일어나고 그때는 이 이벤트 자체가 없다. BE 응답에 필드가 열리면 그 값으로 교체
      track('character_selected', {
        character_id: res.data.preferred_character_id ?? variables.character_id,
        is_auto_assigned: false,
      });
    },
  });
}
