import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { ErrorState } from '@/components/feedback/ErrorState';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { EMPLOYMENT_STATUS_OPTIONS } from '@/constants/signup';
import {
  EditNicknameLayout,
  InputColors,
  NicknameDuplicateCheckClasses,
  ScreenSpacing,
  SignupFlowLayout,
  SignupInfoLayout,
} from '@/constants/theme';
import {
  NicknameDuplicateCheckButton,
  type NicknameDuplicateCheckStatus,
} from '@/features/auth/components/NicknameDuplicateCheckButton';
import { StepIndicator } from '@/features/auth/components/StepIndicator';
import { useSignupInfoSubmit } from '@/features/auth/hooks/useSignupInfoSubmit';
import type { UserAgeRange, UserEmploymentStatus, UserGender } from '@/types/user';
import { cn } from '@/utils/cn';

const SIGNUP_USER_PROFILE_IMAGE = require('@/assets/images/signup/signup_user_profile.png');

const SIGNUP_STEP_COUNT = SignupFlowLayout.totalSteps;
const SIGNUP_CURRENT_STEP = SignupFlowLayout.infoCurrentStep;
const PROFILE_IMAGE_SIZE = EditNicknameLayout.avatarSize;
const NICKNAME_MAX_LENGTH = SignupInfoLayout.nicknameMaxLength;
const NICKNAME_MIN_LENGTH = SignupInfoLayout.nicknameMinLength;
const NICKNAME_HINT_DEFAULT = `닉네임은 ${NICKNAME_MIN_LENGTH}자 이상, 최대 ${NICKNAME_MAX_LENGTH}자까지 가능해요`;
const NICKNAME_HINT_DUPLICATE = '중복된 닉네임입니다';

type GenderOption = UserGender;
type AgeOption = UserAgeRange;
type EmploymentOption = UserEmploymentStatus;

const GENDER_OPTIONS: { value: GenderOption; label: string }[] = [
  { value: 'female', label: '여성' },
  { value: 'male', label: '남성' },
  { value: 'other', label: '선택 안 함' },
];

const AGE_OPTIONS: { value: AgeOption; label: string }[] = [
  { value: '10s', label: '10대' },
  { value: '20s', label: '20대' },
  { value: '30s', label: '30대' },
  { value: '40s', label: '40대+' },
];

const EMPLOYMENT_OPTIONS: { value: EmploymentOption; label: string }[] = [
  ...EMPLOYMENT_STATUS_OPTIONS,
];

interface SelectionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  className?: string;
}

function SelectionChip({ label, selected, onPress, className }: SelectionChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        'self-start items-center justify-center rounded-[25px] border px-4 py-3',
        selected ? 'border-accent/50 bg-accent/10' : 'border-accent/10 bg-accent/5',
        className
      )}
    >
      <ThemedText type="defaultRegular" className={selected ? 'text-fg-default' : 'text-label'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

interface SelectableFieldProps {
  label: string;
  children: ReactNode;
}

function SelectableField({ label, children }: SelectableFieldProps) {
  return (
    <View className="gap-3">
      <ThemedText type="default" className="text-label">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

export default function SignUpInfoScreen() {
  const {
    checkDuplicate,
    submit,
    isDuplicateCheckPending,
    isSubmitPending,
    duplicateCheckError,
    submitError,
    clearErrors,
  } = useSignupInfoSubmit();
  const [nickname, setNickname] = useState('');
  const [isNicknameFocused, setIsNicknameFocused] = useState(false);
  const [gender, setGender] = useState<GenderOption | null>(null);
  const [age, setAge] = useState<AgeOption | null>(null);
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentOption | null>(null);
  const [duplicateCheckStatus, setDuplicateCheckStatus] =
    useState<NicknameDuplicateCheckStatus>('idle');

  const trimmedNickname = nickname.trim();
  const isNicknameValid =
    trimmedNickname.length >= NICKNAME_MIN_LENGTH && trimmedNickname.length <= NICKNAME_MAX_LENGTH;
  const canContinue = isNicknameValid && duplicateCheckStatus === 'available';
  const isNicknameActive = isNicknameFocused || nickname.length > 0;
  const isDuplicateCheckDisabled =
    !isNicknameValid || isDuplicateCheckPending || duplicateCheckStatus !== 'idle';

  const handleNicknameChange = (text: string) => {
    clearErrors();
    setNickname(text.slice(0, NICKNAME_MAX_LENGTH));
    setDuplicateCheckStatus('idle');
  };

  const handleDuplicateCheck = async () => {
    if (!isNicknameValid || isDuplicateCheckPending) {
      return;
    }

    const status = await checkDuplicate(trimmedNickname);
    if (status) {
      setDuplicateCheckStatus(status);
    }
  };

  const handleContinue = async () => {
    if (!canContinue) {
      return;
    }

    const result = await submit({
      nickname: trimmedNickname,
      gender,
      ageRange: age,
      employmentStatus,
    });

    if (result?.conflict) {
      setDuplicateCheckStatus('unavailable');
    }
  };

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground />
      <ScreenContainer className="flex-1 px-8" bottomInsetMin={ScreenSpacing.bottomInsetMin}>
        <View className="pt-4 mt-6">
          <StepIndicator totalSteps={SIGNUP_STEP_COUNT} currentStep={SIGNUP_CURRENT_STEP} />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="grow pb-4"
        >
          <View className="mt-12">
            <ThemedText type="title" className="text-fg">
              MIO에게{'\n'}나를 소개해요
            </ThemedText>
            <ThemedText type="subtitle" className="mt-3 text-subtitle">
              언제든지 수정할 수 있어요
            </ThemedText>
          </View>

          <View className="mt-12 items-center">
            <Image
              source={SIGNUP_USER_PROFILE_IMAGE}
              contentFit="contain"
              style={{ width: PROFILE_IMAGE_SIZE, height: PROFILE_IMAGE_SIZE }}
            />
          </View>

          <View className="mt-8 gap-8">
            <View className="gap-3">
              <ThemedText type="smallTitle" className="text-label">
                닉네임
              </ThemedText>
              <View
                className={cn(
                  'h-16 flex-row items-center rounded-2xl border px-4',
                  isNicknameActive
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-accent/10 bg-accent/5'
                )}
              >
                <TextInput
                  value={nickname}
                  onChangeText={handleNicknameChange}
                  placeholder="닉네임을 입력해 주세요"
                  placeholderTextColor={InputColors.placeholder}
                  onFocus={() => setIsNicknameFocused(true)}
                  onBlur={() => setIsNicknameFocused(false)}
                  maxLength={NICKNAME_MAX_LENGTH}
                  className="flex-1 text-base font-medium text-fg"
                  accessibilityLabel="닉네임"
                />
                <NicknameDuplicateCheckButton
                  status={duplicateCheckStatus}
                  disabled={isDuplicateCheckDisabled}
                  onPress={handleDuplicateCheck}
                />
              </View>
              {duplicateCheckError ? (
                <ErrorState message={duplicateCheckError} className="ml-2 text-left" />
              ) : (
                <ThemedText
                  type="smallRegular"
                  className={cn(
                    'ml-2',
                    duplicateCheckStatus === 'unavailable'
                      ? NicknameDuplicateCheckClasses.errorHint
                      : 'text-label'
                  )}
                >
                  {duplicateCheckStatus === 'unavailable'
                    ? NICKNAME_HINT_DUPLICATE
                    : NICKNAME_HINT_DEFAULT}
                </ThemedText>
              )}
            </View>

            <SelectableField label="성별 (선택)">
              <View className="flex-row flex-wrap justify-start gap-2">
                {GENDER_OPTIONS.map((option) => (
                  <SelectionChip
                    key={option.value}
                    label={option.label}
                    selected={gender === option.value}
                    onPress={() => {
                      clearErrors();
                      setGender((prev) => (prev === option.value ? null : option.value));
                    }}
                  />
                ))}
              </View>
            </SelectableField>

            <SelectableField label="나이 (선택)">
              <View className="flex-row flex-wrap justify-start gap-2">
                {AGE_OPTIONS.map((option) => (
                  <SelectionChip
                    key={option.value}
                    label={option.label}
                    selected={age === option.value}
                    onPress={() => {
                      clearErrors();
                      setAge((prev) => (prev === option.value ? null : option.value));
                    }}
                  />
                ))}
              </View>
            </SelectableField>

            <SelectableField label="직업 (선택)">
              <View className="flex-row flex-wrap justify-start gap-2">
                {EMPLOYMENT_OPTIONS.map((option) => (
                  <SelectionChip
                    key={option.value}
                    label={option.label}
                    selected={employmentStatus === option.value}
                    onPress={() => {
                      clearErrors();
                      setEmploymentStatus((prev) => (prev === option.value ? null : option.value));
                    }}
                  />
                ))}
              </View>
            </SelectableField>
          </View>
        </ScrollView>

        <View className="pt-4 gap-2">
          {submitError ? <ErrorState message={submitError} /> : null}
          <Button disabled={!canContinue || isSubmitPending} onPress={handleContinue}>
            다음
          </Button>
        </View>
      </ScreenContainer>
    </View>
  );
}
