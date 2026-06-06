import { LegalPlaceholderScreen } from '@/features/mypage/components/legalScreen/LegalPlaceholderScreen';

const SENSITIVE_TITLE = '민감정보 수집 및 이용';

export function SensitiveInfoLegalScreen() {
  return <LegalPlaceholderScreen title={SENSITIVE_TITLE} />;
}
