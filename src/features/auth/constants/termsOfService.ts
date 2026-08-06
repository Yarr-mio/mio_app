import { LEGAL_DOCUMENT_IDS, type LegalDocumentId } from '@/constants/legalDocuments';
import type { TermConsentId } from '@/features/auth/utils/buildSignupConsents';

export const TERMS_OF_SERVICE_COPY = {
  pageTitle: '먼저 약관에\n동의해 주세요',
  pageSubtitle: 'MIO를 안전하게 이용하기 위한 약관이에요',
  agreeAllLabel: '전체 동의하기',
  continueLabel: '동의하고 계속하기',
  privacyPolicyLinkLabel: '개인정보 처리방침',
  requiredBadge: '[필수]',
  optionalBadge: '[선택]',
} as const;

export interface TermItem {
  id: TermConsentId;
  label: string;
  required: boolean;
  hasDetail: boolean;
  documentId: LegalDocumentId | null;
}

export const TERM_ITEMS: TermItem[] = [
  { id: 'age', label: '만 14세 이상 확인', required: true, hasDetail: false, documentId: null },
  {
    id: 'service',
    label: '서비스 이용약관',
    required: true,
    hasDetail: true,
    documentId: LEGAL_DOCUMENT_IDS.terms,
  },
  {
    id: 'privacy',
    label: '개인정보 수집 및 이용',
    required: true,
    hasDetail: true,
    documentId: LEGAL_DOCUMENT_IDS.privacyCollection,
  },
  {
    id: 'sensitive',
    label: '민감정보 수집 및 이용',
    required: true,
    hasDetail: true,
    documentId: LEGAL_DOCUMENT_IDS.sensitive,
  },
  {
    id: 'marketing',
    label: '마케팅 정보 수신 동의',
    required: false,
    hasDetail: true,
    documentId: LEGAL_DOCUMENT_IDS.marketing,
  },
];

export const REQUIRED_TERM_IDS = TERM_ITEMS.filter((item) => item.required).map((item) => item.id);

export const INITIAL_CHECKED_STATE: Record<TermConsentId, boolean> = {
  age: false,
  service: false,
  privacy: false,
  sensitive: false,
  marketing: false,
};
