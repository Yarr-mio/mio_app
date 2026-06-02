import { CheckinSummaryRow } from '@/components/checkin/CheckinSummaryRow';
import { EmotionConstellationChart } from '@/components/emotion/EmotionConstellationChart';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { HomeReportBackground } from '@/components/themed/HomeReportBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { HomeCardShell } from '@/components/ui/HomeCardShell';
import {
  getOnboardingCharacterById,
  ONBOARDING_DEFAULT_CHARACTER_ID,
} from '@/constants/characters';
import { EMOTION_META } from '@/constants/emotions';
import { HomeCardClasses, HomeLayout, HomeTextClasses } from '@/constants/theme';
import { HomeRecommendedActionsList } from '@/features/home/components/HomeRecommendedActionsList';
import { useHomeMock } from '@/features/home/hooks/useHomeMock';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/utils/cn';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

export function HomeScreen() {
  const signupInfo = useUserStore((state) => state.signupInfo);
  const onboardingResult = useUserStore((state) => state.onboardingResult);

  const nickname = signupInfo?.nickname ?? '친구';
  const characterId = onboardingResult?.characterId ?? ONBOARDING_DEFAULT_CHARACTER_ID;
  const character = getOnboardingCharacterById(characterId);

  const {
    homeTitle,
    hasCheckIn,
    checkin,
    hasActions,
    actions,
    toggleAction,
    weekLabels,
    weekIntensities,
  } = useHomeMock();

  const checkInEmotionMeta = EMOTION_META[checkin.emotionType];

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

          <View className="mt-6 flex-row items-start gap-3">
            <View className="flex-1">
              <View className="overflow-hidden rounded-tl-[15px] rounded-tr-[15px] rounded-bl-[15px] rounded-br-[3px] border-2 border-speech-bubble-border bg-surface px-5 py-4">
                <ThemedText type="small" className="text-fg-default text-[13px]">
                  {'요즘 조금 힘들어 보여요.\n오늘 하루, 천천히 이야기해 볼까요? 🌿'}
                </ThemedText>
              </View>
            </View>
            <View className="self-end">
              <Image
                source={character.image}
                style={{
                  width: HomeLayout.characterImageSize,
                  height: HomeLayout.characterImageSize,
                }}
                contentFit="contain"
              />
            </View>
          </View>

          <View className="mt-6 gap-2">
            <HomeCardShell
              title="오늘의 체크인"
              headerActionLabel="기록하기"
              onHeaderActionPress={() => router.push('/(main)/home/checkin')}
              contentClassName={!hasCheckIn ? 'flex-1' : undefined}
            >
              {hasCheckIn ? (
                <CheckinSummaryRow
                  emotionIcon={checkInEmotionMeta.image}
                  emotionName={checkInEmotionMeta.label}
                  intensity={checkin.intensity}
                  memo={checkin.memo}
                  time={checkin.time}
                />
              ) : (
                <View className={HomeCardClasses.emptyState}>
                  <ThemedText type="small" className="text-label">
                    등록된 감정이 없어요
                  </ThemedText>
                </View>
              )}
            </HomeCardShell>

            <HomeCardShell
              title="오늘의 추천 행동"
              headerActionLabel="전체보기"
              onHeaderActionPress={() => router.push('/(main)/home/todo')}
              headerContainerClassName="mb-5"
            >
              {hasActions ? (
                <HomeRecommendedActionsList actions={actions} onToggleAction={toggleAction} />
              ) : (
                <View className={HomeCardClasses.emptyState}>
                  <ThemedText type="small" className="text-label">
                    등록된 추천 행동이 없어요
                  </ThemedText>
                </View>
              )}
            </HomeCardShell>

            <HomeCardShell
              title="감정 별자리"
              headerActionLabel="자세히"
              onHeaderActionPress={() => router.push('/(main)/report')}
            >
              <EmotionConstellationChart
                values={weekIntensities}
                labels={weekLabels}
                activeIndex={weekIntensities.length - 1}
              />
            </HomeCardShell>

            <View className="rounded-card border border-line bg-surface p-6">
              <View className="flex-row items-center justify-between">
                <View className="gap-1">
                  <ThemedText type="smallTitle2" className="text-fg-default">
                    마음 탐색
                  </ThemedText>
                  <ThemedText type="small" className="text-subtitle">
                    새로운 테스트로 나를 더 알아가요
                  </ThemedText>
                </View>
                <View className="bg-mind-explore-btn rounded-[10px] px-4 py-2">
                  <ThemedText type="smallBold" className="text-fg-default">
                    테스트 시작
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    </View>
  );
}
