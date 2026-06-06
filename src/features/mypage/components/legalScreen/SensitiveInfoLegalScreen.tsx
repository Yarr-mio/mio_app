import { LegalPlaceholderScreen } from '@/features/mypage/components/legalScreen/LegalPlaceholderScreen';
import { getLegalInfoLabel } from '@/features/mypage/constants/legalInfo';

export function SensitiveInfoLegalScreen() {
  return <LegalPlaceholderScreen title={getLegalInfoLabel('sensitive')} />;
}
