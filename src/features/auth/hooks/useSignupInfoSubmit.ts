import { useRouter } from 'expo-router';
import { useState } from 'react';

import { HTTP_STATUS } from '@/constants/config';
import { AUTH_ROUTES } from '@/constants/routes';
import type { NicknameDuplicateCheckStatus } from '@/features/auth/components/NicknameDuplicateCheckButton';
import { useNicknameDuplicateCheck, useSignupProfile } from '@/features/auth/hooks/useAuth';
import { useHandleSignupStepInvalid } from '@/features/auth/hooks/useHandleSignupStepInvalid';
import { isSignupStepInvalidError } from '@/features/auth/utils/isSignupStepInvalidError';
import { mapSignupProfileInput } from '@/features/auth/utils/mapSignupProfileInput';
import type { UserAgeRange, UserEmploymentStatus, UserGender } from '@/types/user';
import { readApiHttpStatus } from '@/utils/readApiError';

const DUPLICATE_CHECK_ERROR_MESSAGE = '닉네임 중복 확인에 실패했습니다. 다시 시도해 주세요.';
const PROFILE_SUBMIT_ERROR_MESSAGE = '프로필 저장에 실패했습니다. 다시 시도해 주세요.';

export interface SignupInfoFormInput {
  nickname: string;
  gender: UserGender | null;
  ageRange: UserAgeRange | null;
  employmentStatus: UserEmploymentStatus | null;
}

export function useSignupInfoSubmit() {
  const router = useRouter();
  const signupProfile = useSignupProfile();
  const nicknameDuplicateCheck = useNicknameDuplicateCheck();
  const { handleSignupStepInvalid } = useHandleSignupStepInvalid();
  const [duplicateCheckError, setDuplicateCheckError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clearErrors = () => {
    setDuplicateCheckError(null);
    setSubmitError(null);
  };

  const checkDuplicate = async (nickname: string): Promise<NicknameDuplicateCheckStatus | null> => {
    setDuplicateCheckError(null);

    try {
      const response = await nicknameDuplicateCheck.mutateAsync(nickname);
      return response.data.duplicate ? 'unavailable' : 'available';
    } catch (checkError) {
      if (isSignupStepInvalidError(checkError)) {
        await handleSignupStepInvalid();
        return null;
      }

      if (readApiHttpStatus(checkError) === HTTP_STATUS.CONFLICT) {
        return 'unavailable';
      }

      const message =
        checkError instanceof Error ? checkError.message : DUPLICATE_CHECK_ERROR_MESSAGE;
      setDuplicateCheckError(message);
      return null;
    }
  };

  const submit = async ({ nickname, gender, ageRange, employmentStatus }: SignupInfoFormInput) => {
    setSubmitError(null);

    try {
      const response = await signupProfile.mutateAsync(
        mapSignupProfileInput({ nickname, gender, ageRange, employmentStatus })
      );

      if (response.data.signup_step !== 'PROFILE_COMPLETED') {
        throw new Error(PROFILE_SUBMIT_ERROR_MESSAGE);
      }

      router.push(AUTH_ROUTES.onboardingStep4);
    } catch (profileError) {
      if (isSignupStepInvalidError(profileError)) {
        await handleSignupStepInvalid();
        return;
      }

      if (readApiHttpStatus(profileError) === HTTP_STATUS.CONFLICT) {
        return { conflict: true as const };
      }

      const message =
        profileError instanceof Error ? profileError.message : PROFILE_SUBMIT_ERROR_MESSAGE;
      setSubmitError(message);
      return { conflict: false as const };
    }

    return { conflict: false as const };
  };

  return {
    checkDuplicate,
    submit,
    isDuplicateCheckPending: nicknameDuplicateCheck.isPending,
    isSubmitPending: signupProfile.isPending,
    duplicateCheckError,
    submitError,
    clearErrors,
  };
}
