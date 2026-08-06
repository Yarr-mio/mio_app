import { MARKETING_CONSENT_DOCUMENT } from '@/constants/legalDocuments/marketing';
import { PRIVACY_COLLECTION_DOCUMENT } from '@/constants/legalDocuments/privacyCollection';
import { PRIVACY_POLICY_DOCUMENT } from '@/constants/legalDocuments/privacyPolicy';
import { SENSITIVE_INFO_DOCUMENT } from '@/constants/legalDocuments/sensitive';
import { TERMS_OF_SERVICE_DOCUMENT } from '@/constants/legalDocuments/terms';
import { LEGAL_DOCUMENT_IDS, type LegalDocument, type LegalDocumentId } from '@/types/legal';

export {
  LEGAL_DOCUMENT_IDS,
  type LegalBlock,
  type LegalDocument,
  type LegalDocumentId,
} from '@/types/legal';

export const LEGAL_DOCUMENT_BULLET_MARK = '·';

const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  [LEGAL_DOCUMENT_IDS.terms]: TERMS_OF_SERVICE_DOCUMENT,
  [LEGAL_DOCUMENT_IDS.privacyCollection]: PRIVACY_COLLECTION_DOCUMENT,
  [LEGAL_DOCUMENT_IDS.privacyPolicy]: PRIVACY_POLICY_DOCUMENT,
  [LEGAL_DOCUMENT_IDS.marketing]: MARKETING_CONSENT_DOCUMENT,
  [LEGAL_DOCUMENT_IDS.sensitive]: SENSITIVE_INFO_DOCUMENT,
};

export function isLegalDocumentId(value: string): value is LegalDocumentId {
  return Object.values(LEGAL_DOCUMENT_IDS).includes(value as LegalDocumentId);
}

export function getLegalDocument(documentId: LegalDocumentId): LegalDocument {
  return LEGAL_DOCUMENTS[documentId];
}

export function getLegalDocumentTitle(documentId: LegalDocumentId): string {
  return LEGAL_DOCUMENTS[documentId].title;
}
