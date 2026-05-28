import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { InputColors, ScreenSpacing } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import type { UserAgeRange, UserGender } from '@/types/user';
import { cn } from '@/utils/cn';

const SIGNUP_USER_PROFILE_IMAGE = require('@/assets/images/signup/signup_user_profile.png');

const SIGNUP_STEP_COUNT = 4;
const SIGNUP_CURRENT_STEP = 3;
const NICKNAME_MAX_LENGTH = 10;
const PROFILE_IMAGE_SIZE = 107;

type GenderOption = UserGender | 'none';
type AgeOption = UserAgeRange;

const GENDER_OPTIONS: { value: GenderOption; label: string }[] = [
  { value: 'female', label: '여성' },
  { value: 'male', label: '남성' },
  { value: 'none', label: '선택 안 함' },
];

const AGE_OPTIONS: { value: AgeOption; label: string }[] = [
  { value: '10s', label: '10대' },
  { value: '20s', label: '20대' },
  { value: '30s', label: '30대' },
  { value: '40s', label: '40대+' },
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
  const router = useRouter();
  const { setSignupInfo } = useUserStore();
  const [nickname, setNickname] = useState('');
  const [isNicknameFocused, setIsNicknameFocused] = useState(false);
  const [gender, setGender] = useState<GenderOption | null>(null);
  const [age, setAge] = useState<AgeOption | null>(null);

  const trimmedNickname = nickname.trim();
  const canContinue = trimmedNickname.length > 0;
  const isNicknameActive = isNicknameFocused || nickname.length > 0;

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }

    const normalizedGender = gender === 'none' ? null : gender;
    setSignupInfo({
      nickname: trimmedNickname,
      gender: normalizedGender,
      ageRange: age,
    });

    router.push({
      pathname: '/(auth)/signup/complete',
      params: { nickname: trimmedNickname },
    });
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
                  'h-16 justify-center rounded-2xl border px-4',
                  isNicknameActive
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-accent/10 bg-accent/5'
                )}
              >
                <TextInput
                  value={nickname}
                  onChangeText={(text) => setNickname(text.slice(0, NICKNAME_MAX_LENGTH))}
                  placeholder="닉네임을 입력해 주세요"
                  placeholderTextColor={InputColors.placeholder}
                  onFocus={() => setIsNicknameFocused(true)}
                  onBlur={() => setIsNicknameFocused(false)}
                  className="text-base font-medium text-fg"
                  accessibilityLabel="닉네임"
                />
              </View>
              <ThemedText type="smallRegular" className="ml-2 text-label">
                닉네임 설정은 최대 {NICKNAME_MAX_LENGTH}자까지 가능해요
              </ThemedText>
            </View>

            <SelectableField label="성별 (선택)">
              <View className="flex-row flex-wrap justify-start gap-2">
                {GENDER_OPTIONS.map((option) => (
                  <SelectionChip
                    key={option.value}
                    label={option.label}
                    selected={gender === option.value}
                    onPress={() =>
                      setGender((prev) => (prev === option.value ? null : option.value))
                    }
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
                    onPress={() => setAge((prev) => (prev === option.value ? null : option.value))}
                  />
                ))}
              </View>
            </SelectableField>
          </View>
        </ScrollView>

        <View className="pt-4">
          <Button disabled={!canContinue} onPress={handleContinue}>
            다음
          </Button>
        </View>
      </ScreenContainer>
    </View>
  );
}
