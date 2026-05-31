import CheckboxCheckIcon from '@/assets/icons/checkbox-check.svg';
import ChevronRightIcon from '@/assets/icons/chevron-right.svg';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { HomeReportBackground } from '@/components/themed/HomeReportBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Label } from '@/components/ui/Label';
import {
  getOnboardingCharacterById,
  ONBOARDING_DEFAULT_CHARACTER_ID,
  type OnboardingCharacterId,
} from '@/constants/characters';
import { EMOTION_META } from '@/constants/emotions';
import { FgColors, HomeCardClasses, HomeLayout, HomeTextClasses } from '@/constants/theme';
import { CharacterSpeechBubble } from '@/features/home/components/CharacterSpeechBubble';
import { useUserStore } from '@/store/userStore';
import type { EmotionType } from '@/types/checkin';
import { cn } from '@/utils/cn';
import { Image } from 'expo-image';
import { useState, type PropsWithChildren } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import type { ImageSourcePropType } from 'react-native';

// mock 데이터
const MOCK_HAS_CHECKED_IN_TODAY = false;
const MOCK_HAS_CHECK_IN = true;
const MOCK_HAS_ACTIONS = true;

const MOCK_HOME_TITLE_UNCHECKED = '오늘도 잘 찾아왔어요';
const MOCK_HOME_TITLE_CHECKED = '오늘의 마음을 꺼내 봐요';
const MOCK_CHECK_IN = {
  emotionType: 'tired' as EmotionType,
  emotionName: '지침',
  intensity: 3,
  memo: '"일이 생각대로 되지 않아"',
  time: '오전 10:45',
};

interface MockRecommendedAction {
  id: string;
  text: string;
  completed: boolean;
}

const MOCK_ACTIONS_INITIAL: MockRecommendedAction[] = [
  { id: '1', text: '5분-호흡 연습하기', completed: true },
  { id: '2', text: '생각의 흐름을 있는 그대로 적어 보기', completed: true },
  { id: '3', text: '왜곡된 생각이 없는지 체크해 보기', completed: false },
];

interface CardHeaderLinkProps {
  label: string;
  onPress?: () => void;
}

function CardHeaderLink({ label, onPress }: CardHeaderLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <ThemedText type="small" className="text-fg-default">
        {label}
      </ThemedText>
      <ChevronRightIcon
        width={HomeLayout.chevronIconWidth}
        height={HomeLayout.chevronIconHeight}
        color={FgColors.onDefault}
      />
    </Pressable>
  );
}

interface HomeCardShellProps extends PropsWithChildren {
  title: string;
  headerActionLabel: string;
  onHeaderActionPress?: () => void;
  contentClassName?: string;
  headerContainerClassName?: string;
}

function HomeCardShell({
  title,
  headerActionLabel,
  onHeaderActionPress,
  contentClassName,
  headerContainerClassName = 'mb-3',
  children,
}: HomeCardShellProps) {
  return (
    <View className={HomeCardClasses.container}>
      <View className={cn('flex-row items-center justify-between', headerContainerClassName)}>
        <ThemedText type="smallTitle2" className="text-fg-default">
          {title}
        </ThemedText>
        <CardHeaderLink label={headerActionLabel} onPress={onHeaderActionPress} />
      </View>
      <View className={cn(contentClassName)}>{children}</View>
    </View>
  );
}

interface CharacterSectionProps {
  characterId: OnboardingCharacterId;
  greeting: string;
}

function CharacterSection({ characterId, greeting }: CharacterSectionProps) {
  const character = getOnboardingCharacterById(characterId);

  return (
    <View className="mt-6 flex-row items-end gap-3">
      <View className="flex-1">
        <CharacterSpeechBubble message={greeting} />
      </View>
      <Image
        source={character.image}
        style={{
          width: HomeLayout.characterImageSize,
          height: HomeLayout.characterImageSize,
        }}
        contentFit="contain"
      />
    </View>
  );
}

interface CheckInContentProps {
  emotionIcon: ImageSourcePropType;
  emotionName: string;
  intensity: number;
  memo: string;
  time: string;
}

function CheckInContent({ emotionIcon, emotionName, intensity, memo, time }: CheckInContentProps) {
  return (
    <View className="flex-row gap-3">
      <Image
        source={emotionIcon}
        style={{ width: HomeLayout.emotionIconSize, height: HomeLayout.emotionIconSize }}
        contentFit="contain"
      />
      <View className="flex-1 gap-2">
        <View className="flex-row items-center gap-2">
          <ThemedText type="defaultBold" className="text-fg-default">
            {emotionName}
          </ThemedText>
          <Label label={`감도 ${intensity}/5`} />
        </View>
        <ThemedText type="small" className="text-fg-default" numberOfLines={1}>
          {memo}
        </ThemedText>
        <ThemedText type="smallMedium" className="text-fg-muted">
          {time}
        </ThemedText>
      </View>
    </View>
  );
}

interface TodoCheckboxProps {
  completed: boolean;
  onToggle: () => void;
}

function TodoCheckbox({ completed, onToggle }: TodoCheckboxProps) {
  return (
    <Pressable
      onPress={onToggle}
      className={cn(
        'items-center justify-center rounded-full',
        completed ? 'bg-accent' : 'border border-fg-default/30 bg-transparent'
      )}
      style={{ width: HomeLayout.checkboxSize, height: HomeLayout.checkboxSize }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
    >
      {completed ? (
        <CheckboxCheckIcon
          width={HomeLayout.checkboxCheckWidth}
          height={HomeLayout.checkboxCheckHeight}
          color={FgColors.default}
        />
      ) : null}
    </Pressable>
  );
}

interface RecommendedActionItemProps {
  text: string;
  completed: boolean;
  onToggle: () => void;
}

function RecommendedActionItem({ text, completed, onToggle }: RecommendedActionItemProps) {
  return (
    <View className="flex-row items-center gap-3">
      <TodoCheckbox completed={completed} onToggle={onToggle} />
      <ThemedText
        type="small"
        className={cn('flex-1', completed ? 'text-label line-through' : 'text-fg-default')}
      >
        {text}
      </ThemedText>
    </View>
  );
}

function EmptyCardMessage({ message }: { message: string }) {
  return (
    <View
      className="items-center justify-center"
      style={{ minHeight: HomeLayout.cardMinHeightEmpty }}
    >
      <ThemedText type="small" className="text-label">
        {message}
      </ThemedText>
    </View>
  );
}

export function HomeScreen() {
  const signupInfo = useUserStore((state) => state.signupInfo);
  const onboardingResult = useUserStore((state) => state.onboardingResult);

  const nickname = signupInfo?.nickname ?? '친구';
  const characterId = onboardingResult?.characterId ?? ONBOARDING_DEFAULT_CHARACTER_ID;
  const character = getOnboardingCharacterById(characterId);

  const homeTitle = MOCK_HAS_CHECKED_IN_TODAY ? MOCK_HOME_TITLE_CHECKED : MOCK_HOME_TITLE_UNCHECKED;

  const [actions, setActions] = useState(() =>
    MOCK_ACTIONS_INITIAL.map((action) => ({ ...action }))
  );

  const toggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((action) =>
        action.id === id ? { ...action, completed: !action.completed } : action
      )
    );
  };

  const checkInEmotionMeta = EMOTION_META[MOCK_CHECK_IN.emotionType];

  return (
    <View className="flex-1 bg-midnight">
      <HomeReportBackground />
      <ScreenContainer className="flex-1 bg-transparent">
        <ScrollView
          className="flex-1 bg-transparent"
          contentContainerClassName="grow px-8 pb-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-10">
            <ThemedText type="default" className="text-fg">
              안녕하세요, {nickname} 님! 🌙
            </ThemedText>
            <ThemedText
              type="defaultBold"
              className={cn('mt-2 text-fg', HomeTextClasses.homeTitle)}
            >
              {homeTitle}
            </ThemedText>
            <ThemedText type="small" className={cn('mt-1', HomeTextClasses.supportSubtitle)}>
              당신의 매일을 응원할게요
            </ThemedText>
          </View>

          <CharacterSection characterId={characterId} greeting={character.greeting} />

          <View className="mt-6 gap-2">
            <HomeCardShell
              title="오늘의 체크인"
              headerActionLabel="기록하기"
              contentClassName={!MOCK_HAS_CHECK_IN ? 'flex-1' : undefined}
            >
              {MOCK_HAS_CHECK_IN ? (
                <CheckInContent
                  emotionIcon={checkInEmotionMeta.image}
                  emotionName={MOCK_CHECK_IN.emotionName}
                  intensity={MOCK_CHECK_IN.intensity}
                  memo={MOCK_CHECK_IN.memo}
                  time={MOCK_CHECK_IN.time}
                />
              ) : (
                <EmptyCardMessage message="등록된 감정이 없어요" />
              )}
            </HomeCardShell>

            <HomeCardShell
              title="오늘의 추천 행동"
              headerActionLabel="전체보기"
              headerContainerClassName="mb-5"
            >
              {MOCK_HAS_ACTIONS ? (
                <View className="gap-4">
                  {actions.map((action) => (
                    <RecommendedActionItem
                      key={action.id}
                      text={action.text}
                      completed={action.completed}
                      onToggle={() => toggleAction(action.id)}
                    />
                  ))}
                </View>
              ) : (
                <EmptyCardMessage message="등록된 추천 행동이 없어요" />
              )}
            </HomeCardShell>
          </View>
        </ScrollView>
      </ScreenContainer>
    </View>
  );
}
