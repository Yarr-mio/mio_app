import CheckboxCheckIcon from '@/assets/icons/checkbox-check.svg';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import {
  type OnboardingConcernType,
  ONBOARDING_CONCERN_OPTIONS,
  ONBOARDING_TOTAL_STEPS,
} from '@/constants/onboarding';
import { FgColors, PressableConfig, ScreenSpacing } from '@/constants/theme';
import { readApiErrorMessage } from '@/features/auth/utils/readApiError';
import { OnboardingHeader } from '@/features/onboarding/components/OnboardingHeader';
import { OnboardingSkipButton } from '@/features/onboarding/components/OnboardingSkipButton';
import { useOnboardingStep2 } from '@/features/onboarding/hooks/useOnboarding';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { cn } from '@/utils/cn';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ONBOARDING_CURRENT_STEP = 2;

interface ConcernButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function ConcernButton({ label, selected, onPress }: ConcernButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn(
        'items-start justify-start rounded-full border px-4 py-2',
        selected
          ? 'border-sub-tab-selected-border bg-sub-tab-selected-bg'
          : 'border-sub-tab-concern-inactive-border bg-transparent'
      )}
      hitSlop={PressableConfig.hitSlop}
    >
      <View className={cn('flex-row items-center', selected && 'gap-2')}>
        {selected && <CheckboxCheckIcon width={12} height={9} color={FgColors.onDefault} />}
        <ThemedText type="default" className={selected ? 'text-fg-default' : 'text-label'}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function Step2ConcernScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { concern_types, setConcernTypes } = useOnboardingStore();
  const onboardingStep2 = useOnboardingStep2();

  const selectedConcerns = (concern_types ?? []) as OnboardingConcernType[];
  const isConcernSelected = selectedConcerns.length > 0;
  const isPending = onboardingStep2.isPending;

  const toggleConcern = (id: OnboardingConcernType) => {
    const nextSelected = selectedConcerns.includes(id)
      ? selectedConcerns.filter((item) => item !== id)
      : [...selectedConcerns, id];

    setConcernTypes(nextSelected.length === 0 ? null : nextSelected);
  };

  const handleSkip = () => {
    setConcernTypes(null);
    router.push('/(auth)/onboarding/step3Style');
  };

  const handleNext = async () => {
    if (!isConcernSelected) {
      return;
    }

    try {
      const response = await onboardingStep2.mutateAsync({
        concern_types: selectedConcerns,
        responses: [{ question_id: 'q2', answer: selectedConcerns[0] }],
      });
      console.log('[온보딩 2단계] 응답값', response.data);
      router.push('/(auth)/onboarding/step3Style');
    } catch (error) {
      Alert.alert('주요 고민', readApiErrorMessage(error));
    }
  };

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground />
      <View
        className="flex-1 px-8"
        style={{
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, ScreenSpacing.bottomInsetMin),
        }}
      >
        <View className="pt-4 mt-6">
          <OnboardingHeader
            currentStep={ONBOARDING_CURRENT_STEP}
            totalSteps={ONBOARDING_TOTAL_STEPS}
          />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="grow pb-4"
        >
          <View className="mt-10">
            <ThemedText type="title" className="text-fg">
              주요 고민이 뭔가요?
            </ThemedText>
            <ThemedText type="subtitle" className="mt-3 text-subtitle">
              해당되는 것을 선택해 주세요
            </ThemedText>
          </View>

          <View className="mt-8 flex-row flex-wrap gap-3">
            {ONBOARDING_CONCERN_OPTIONS.map((option) => (
              <ConcernButton
                key={option.id}
                label={option.label}
                selected={selectedConcerns.includes(option.id)}
                onPress={() => toggleConcern(option.id)}
              />
            ))}
          </View>
        </ScrollView>

        <View className="pt-4">
          <Button disabled={!isConcernSelected || isPending} onPress={handleNext}>
            다음
          </Button>
          <OnboardingSkipButton
            label="건너뛰기"
            onPress={handleSkip}
            className="items-center py-4"
          />
        </View>
      </View>
    </View>
  );
}
