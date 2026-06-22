import { useRouter } from 'expo-router';
import { useState } from 'react';

import { AUTH_ROUTES } from '@/constants/routes';
import { useSignupConsent } from '@/features/auth/hooks/useAuth';
import { useHandleSignupStepInvalid } from '@/features/auth/hooks/useHandleSignupStepInvalid';
import { buildSignupConsents, type TermConsentId } from '@/features/auth/utils/buildSignupConsents';
import { isSignupStepInvalidError } from '@/features/auth/utils/isSignupStepInvalidError';

const CONSENT_SUBMIT_ERROR_MESSAGE = '약관 동의에 실패했습니다. 다시 시도해 주세요.';

export function useTermsOfServiceSubmit() {
  const router = useRouter();
  const signupConsent = useSignupConsent();
  const { handleSignupStepInvalid } = useHandleSignupStepInvalid();
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const submit = async (checkedState: Record<TermConsentId, boolean>) => {
    setError(null);

    try {
      const response = await signupConsent.mutateAsync({
        consents: buildSignupConsents(checkedState),
      });

      if (response.data.signup_step !== 'CONSENT_AGREED') {
        throw new Error(CONSENT_SUBMIT_ERROR_MESSAGE);
      }

      router.push(AUTH_ROUTES.signupInfo);
    } catch (submitError) {
      if (isSignupStepInvalidError(submitError)) {
        await handleSignupStepInvalid();
        return;
      }

      const message =
        submitError instanceof Error ? submitError.message : CONSENT_SUBMIT_ERROR_MESSAGE;
      setError(message);
    }
  };

  return {
    submit,
    isPending: signupConsent.isPending,
    error,
    clearError,
  };
}
