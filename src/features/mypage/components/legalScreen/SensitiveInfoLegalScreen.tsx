import { LegalDocumentScreen } from '@/components/legal/LegalDocumentScreen';
import { LEGAL_DOCUMENT_IDS } from '@/constants/legalDocuments';

export function SensitiveInfoLegalScreen() {
  return <LegalDocumentScreen documentId={LEGAL_DOCUMENT_IDS.sensitive} />;
}
