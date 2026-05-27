import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import {
  ONBOARDING_STYLE_OPTIONS,
  ONBOARDING_TOTAL_STEPS,
  type OnboardingStyleType,
} from '@/constants/onboarding';
import { OnboardingStyleCardLayout, PressableConfig, ScreenSpacing } from '@/constants/theme';
import { OnboardingHeader } from '@/features/onboarding/components/OnboardingHeader';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { cn } from '@/utils/cn';
import { Image, type ImageSource } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ONBOARDING_CURRENT_STEP = 3;

interface SkipButtonProps {
  onPress: () => void;
  className?: string;
}

function SkipButton({ onPress, className }: SkipButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="건너뛰기"
      className={className}
      hitSlop={PressableConfig.hitSlop}
    >
      <ThemedText type="default" className="text-subtitle">
        건너뛰기
      </ThemedText>
    </Pressable>
  );
}

interface StyleOptionCardProps {
  title: string;
  description: string;
  characterImage: ImageSource;
  selected: boolean;
  onPress: () => void;
}

function StyleOptionCard({
  title,
  description,
  characterImage,
  selected,
  onPress,
}: StyleOptionCardProps) {
  const { iconSlotSize, iconRenderScale } = OnboardingStyleCardLayout;
  const iconRenderSize = iconSlotSize * iconRenderScale;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      className={cn(
        'flex-row items-center gap-3 rounded-card border-2 py-2.5 pl-2 pr-4',
        selected
          ? 'border-sub-tab-selected-border bg-sub-tab-selected-bg'
          : 'border-sub-tab-inactive-border bg-sub-tab-inactive-bg'
      )}
      hitSlop={PressableConfig.hitSlop}
    >
      <View
        style={{
          width: iconSlotSize,
          height: iconSlotSize,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={characterImage}
          style={{ width: iconRenderSize, height: iconRenderSize }}
          contentFit="contain"
        />
      </View>
      <View className="flex-1 gap-1">
        <ThemedText type="default" className="font-semibold text-fg-default">
          {title}
        </ThemedText>
        <ThemedText type="default" className="font-normal leading-5 text-fg-default/80">
          {description}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function Step3StyleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { preferred_style, setPreferredStyle, setCharacterId } = useOnboardingStore();

  const selectedStyle = preferred_style as OnboardingStyleType | null;
  const isStyleSelected = selectedStyle !== null;

  const handleSelectStyle = (
    styleId: OnboardingStyleType,
    characterId: (typeof ONBOARDING_STYLE_OPTIONS)[number]['characterId']
  ) => {
    setPreferredStyle(styleId);
    setCharacterId(characterId);
  };

  const handleSkip = () => {
    setPreferredStyle(null);
    setCharacterId(null);
    router.push('/(auth)/onboarding/step4Character');
  };

  const handleNext = () => {
    if (!isStyleSelected) {
      return;
    }
    router.push('/(auth)/onboarding/step4Character');
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
            <ThemedText type="subtitle" className="font-bold leading-10 text-fg">
              어떤 대화 방식이{'\n'}편하세요?
            </ThemedText>
            <ThemedText type="default" className="mt-3 text-subtitle">
              나중에 언제든지 바꿀 수 있어요
            </ThemedText>
          </View>

          <View className="mt-8 gap-3">
            {ONBOARDING_STYLE_OPTIONS.map((option) => (
              <StyleOptionCard
                key={option.id}
                title={option.title}
                description={option.description}
                characterImage={option.characterImage}
                selected={selectedStyle === option.id}
                onPress={() => handleSelectStyle(option.id, option.characterId)}
              />
            ))}
          </View>
        </ScrollView>

        <View className="pt-4">
          <Button disabled={!isStyleSelected} onPress={handleNext}>
            다음
          </Button>
          <SkipButton onPress={handleSkip} className="items-center py-4" />
        </View>
      </View>
    </View>
  );
}
