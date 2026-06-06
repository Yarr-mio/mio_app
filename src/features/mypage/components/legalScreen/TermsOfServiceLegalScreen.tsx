import { LegalPlaceholderScreen } from '@/features/mypage/components/legalScreen/LegalPlaceholderScreen';
import { getLegalInfoLabel } from '@/features/mypage/constants/legalInfo';

export function TermsOfServiceLegalScreen() {
  return <LegalPlaceholderScreen title={getLegalInfoLabel('terms')} />;
}
