import { AUTH_CONSENT_VERSION } from '@/constants/config';
import type { ConsentType, SignupConsent } from '@/types/auth';

export type TermConsentId = 'service' | 'privacy' | 'age' | 'marketing';

const TERM_TO_CONSENT_TYPE: Record<TermConsentId, ConsentType> = {
  service: 'terms',
  privacy: 'privacy',
  age: 'age_verification',
  marketing: 'marketing',
};

export function buildSignupConsents(checkedState: Record<TermConsentId, boolean>): SignupConsent[] {
  return (Object.keys(TERM_TO_CONSENT_TYPE) as TermConsentId[]).map((id) => ({
    type: TERM_TO_CONSENT_TYPE[id],
    agreed: id === 'marketing' ? checkedState[id] : true,
    version: AUTH_CONSENT_VERSION,
  }));
}
