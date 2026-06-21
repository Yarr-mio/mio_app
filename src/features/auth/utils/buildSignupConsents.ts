import { AUTH_CONSENT_VERSION } from '@/constants/config';
import type { ConsentType, SignupConsent } from '@/types/auth';

export type TermConsentId = 'service' | 'privacy' | 'age' | 'sensitive' | 'marketing';

const TERM_CONSENT_ORDER: TermConsentId[] = ['age', 'service', 'privacy', 'sensitive', 'marketing'];

const TERM_TO_CONSENT_TYPE: Record<TermConsentId, ConsentType> = {
  service: 'terms',
  privacy: 'privacy',
  age: 'age_verification',
  sensitive: 'sensitive_info',
  marketing: 'marketing',
};

export function buildSignupConsents(checkedState: Record<TermConsentId, boolean>): SignupConsent[] {
  return TERM_CONSENT_ORDER.map((id) => ({
    type: TERM_TO_CONSENT_TYPE[id],
    agreed: id === 'sensitive' || id === 'marketing' ? checkedState[id] : true,
    version: AUTH_CONSENT_VERSION,
  }));
}
