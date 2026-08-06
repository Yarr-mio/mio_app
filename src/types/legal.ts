export const LEGAL_DOCUMENT_IDS = {
  terms: 'terms',
  privacyCollection: 'privacyCollection',
  privacyPolicy: 'privacyPolicy',
  marketing: 'marketing',
  sensitive: 'sensitive',
} as const;

export type LegalDocumentId = (typeof LEGAL_DOCUMENT_IDS)[keyof typeof LEGAL_DOCUMENT_IDS];

export type LegalBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet'; text: string };

export interface LegalDocument {
  id: LegalDocumentId;
  title: string;
  blocks: LegalBlock[];
}
