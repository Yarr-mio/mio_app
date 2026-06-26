import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { HTTP_STATUS } from '@/constants/config';
import { EditNicknameLayout, SignupInfoLayout } from '@/constants/theme';
import { useNicknameDuplicateCheck } from '@/features/auth/hooks/useAuth';
import { readApiHttpStatus } from '@/features/auth/utils/readApiError';
import { useUpdateProfile } from '@/features/mypage/hooks/useMypage';
import { useSelectedNickname } from '@/hooks/useSelectedCharacterId';

const DEBOUNCE_MS = 500;
const { maxLength } = EditNicknameLayout;
const NICKNAME_MIN_LENGTH = SignupInfoLayout.nicknameMinLength;

export function useEditNickname() {
  const router = useRouter();
  const selectedNickname = useSelectedNickname();
  const initialNickname = selectedNickname ?? '';
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { mutateAsync: checkNicknameDuplicate } = useNicknameDuplicateCheck();
  const [nickname, setNickname] = useState(initialNickname);
  const [isDuplicateConflict, setIsDuplicateConflict] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  const trimmedNickname = nickname.trim();
  const canSave =
    trimmedNickname.length >= NICKNAME_MIN_LENGTH &&
    trimmedNickname !== initialNickname &&
    isAvailable &&
    !isDuplicateConflict;

  useEffect(() => {
    if (trimmedNickname.length < NICKNAME_MIN_LENGTH) {
      setIsDuplicateConflict(false);
      setIsAvailable(false);
      return;
    }

    if (trimmedNickname === initialNickname) {
      setIsDuplicateConflict(false);
      setIsAvailable(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void checkNicknameDuplicate(trimmedNickname)
        .then((response) => {
          if (!cancelled) {
            if (response.data.duplicate) {
              setIsDuplicateConflict(true);
              setIsAvailable(false);
              return;
            }

            setIsDuplicateConflict(false);
            setIsAvailable(true);
          }
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }

          if (readApiHttpStatus(error) === HTTP_STATUS.CONFLICT) {
            setIsDuplicateConflict(true);
            setIsAvailable(false);
            return;
          }

          console.error('[useEditNickname] duplicate check failed', error);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmedNickname, initialNickname, checkNicknameDuplicate]);

  const handleNicknameChange = (text: string) => {
    setNickname(text.slice(0, maxLength));
    setIsDuplicateConflict(false);
    setIsAvailable(false);
  };

  const handleClear = () => {
    setNickname('');
    setIsDuplicateConflict(false);
    setIsAvailable(false);
  };

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    updateProfile(
      { nickname: trimmedNickname },
      {
        onSuccess: () => {
          router.back();
        },
        onError: (error) => {
          if (readApiHttpStatus(error) === HTTP_STATUS.CONFLICT) {
            setIsDuplicateConflict(true);
            setIsAvailable(false);
          }
        },
      }
    );
  };

  return {
    nickname,
    isDuplicateConflict,
    isAvailable,
    canSave,
    isPending,
    handleNicknameChange,
    handleClear,
    handleSave,
  };
}
