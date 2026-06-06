export type LegalInfoItemId = 'terms' | 'privacy' | 'sensitive';

export interface LegalInfoItem {
  id: LegalInfoItemId;
  label: string;
}

export const LEGAL_INFO_ITEMS: LegalInfoItem[] = [
  { id: 'terms', label: '서비스 이용 약관' },
  { id: 'privacy', label: '개인정보 처리 방침' },
  { id: 'sensitive', label: '민감정보 (정서·심리) 수집 및 이용' },
];

export function getLegalInfoLabel(id: LegalInfoItemId): string {
  const item = LEGAL_INFO_ITEMS.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`Unknown legal info id: ${id}`);
  }
  return item.label;
}
