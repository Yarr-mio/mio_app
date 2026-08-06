import { LegalDocumentScreen } from '@/components/legal/LegalDocumentScreen';
import { LEGAL_DOCUMENT_IDS } from '@/constants/legalDocuments';

export function PrivacyPolicyLegalScreen() {
  return <LegalDocumentScreen documentId={LEGAL_DOCUMENT_IDS.privacyPolicy} />;
}
