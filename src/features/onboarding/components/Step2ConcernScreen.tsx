import CheckboxCheckIcon from '@/assets/icons/checkbox-check.svg';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import {
  type OnboardingConcernType,
  ONBOARDING_CONCERN_OPTIONS,
  ONBOARDING_CURRENT_STEPS,
  ONBOARDING_TOTAL_STEPS,
} from '@/constants/onboarding';
import { FgColors, HomeLayout, PressableConfig, ScreenSpacing } from '@/constants/theme';
import { OnboardingHeader } from '@/features/onboarding/components/OnboardingHeader';
import { OnboardingSkipButton } from '@/features/onboarding/components/OnboardingSkipButton';
import { useOnboardingSelection } from '@/features/onboarding/hooks/useOnboardingSelection';
import { useOnboardingStep2Submit } from '@/features/onboarding/hooks/useOnboardingStep2Submit';
import { useOnboardingStepSkip } from '@/features/onboarding/hooks/useOnboardingStepSkip';
import type { OnboardingSkippableStep } from '@/types/onboarding';
import { cn } from '@/utils/cn';
import { Pressable, ScrollView, View } from 'react-native';

const ONBOARDING_CURRENT_STEP = ONBOARDING_CURRENT_STEPS.step2 as OnboardingSkippableStep;

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
        {selected && (
          <CheckboxCheckIcon
            width={HomeLayout.checkboxCheckWidth}
            height={HomeLayout.checkboxCheckHeight}
            color={FgColors.onDefault}
          />
        )}
        <ThemedText type="default" className={selected ? 'text-fg-default' : 'text-label'}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function Step2ConcernScreen() {
  const { concern_types, setConcernTypes } = useOnboardingSelection();
  const { submit, isPending, error, clearError } = useOnboardingStep2Submit();
  const {
    skip,
    isPending: isSkipPending,
    error: skipError,
    clearError: clearSkipError,
  } = useOnboardingStepSkip();

  const isActionPending = isPending || isSkipPending;
  const actionError = error ?? skipError;

  const selectedConcerns = (concern_types ?? []) as OnboardingConcernType[];
  const isConcernSelected = selectedConcerns.length > 0;

  const clearActionError = () => {
    clearError();
    clearSkipError();
  };

  const toggleConcern = (id: OnboardingConcernType) => {
    clearActionError();
    const nextSelected = selectedConcerns.includes(id)
      ? selectedConcerns.filter((item) => item !== id)
      : [...selectedConcerns, id];

    setConcernTypes(nextSelected.length === 0 ? null : nextSelected);
  };

  const handleSkip = async () => {
    const success = await skip(ONBOARDING_CURRENT_STEP);
    if (success) {
      setConcernTypes(null);
    }
  };

  const handleNext = () => {
    if (!isConcernSelected) {
      return;
    }

    void submit(selectedConcerns);
  };

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground />
      <ScreenContainer className="flex-1 px-8" bottomInsetMin={ScreenSpacing.bottomInsetMin}>
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

        <View className="pt-4 gap-2">
          {actionError ? <ErrorState message={actionError} /> : null}
          <Button disabled={!isConcernSelected || isActionPending} onPress={handleNext}>
            다음
          </Button>
          <OnboardingSkipButton
            label="건너뛰기"
            onPress={handleSkip}
            disabled={isActionPending}
            className="items-center py-4"
          />
        </View>
      </ScreenContainer>
    </View>
  );
}
