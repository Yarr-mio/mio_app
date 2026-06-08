import {
  ONBOARDING_DEFAULT_CHARACTER_ID,
  type OnboardingCharacterId,
} from '@/constants/characters';
import { create } from 'zustand';

/**
 * 사용자가 더보기 페이지에서 변경한 캐릭터 값 저장
 */
interface PartnerState {
  /** 사용자가 더보기에서 확정한 AI 파트너 key */
  selectedPartner: OnboardingCharacterId;
  setSelectedPartner: (key: OnboardingCharacterId) => void;
}

export const usePartnerStore = create<PartnerState>((set) => ({
  selectedPartner: ONBOARDING_DEFAULT_CHARACTER_ID,
  setSelectedPartner: (key) => set({ selectedPartner: key }),
}));
