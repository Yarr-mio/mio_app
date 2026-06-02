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
import {
  HomeActionClasses,
  HomeCardClasses,
  HomeLayout,
  HomeSpeechBubbleClasses,
  HomeTextClasses,
} from '@/constants/theme';
import { useCheckinToday } from '@/features/checkin/hooks/useCheckin';
import { HomeRecommendedActionsList } from '@/features/home/components/HomeRecommendedActionsList';
import { useHomeMock } from '@/features/home/hooks/useHomeMock';
import { useUserStore } from '@/store/userStore';
import type { CheckinRecord } from '@/types/checkin';
import { cn } from '@/utils/cn';
import { formatCheckinTime } from '@/utils/date';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

function getLatestTodayCheckin(checkins: CheckinRecord[]): CheckinRecord | undefined {
  if (checkins.length === 0) {
    return undefined;
  }

  return checkins.reduce((latest, current) =>
    current.created_at > latest.created_at ? current : latest
  );
}

export function HomeScreen() {
  const signupInfo = useUserStore((state) => state.signupInfo);
  const onboardingResult = useUserStore((state) => state.onboardingResult);

  const nickname = signupInfo?.nickname ?? '친구';
  const characterId = onboardingResult?.characterId ?? ONBOARDING_DEFAULT_CHARACTER_ID;
  const character = getOnboardingCharacterById(characterId);

  const { data: todayCheckinData } = useCheckinToday();
  const todayCheckin = getLatestTodayCheckin(todayCheckinData?.checkins ?? []);
  const todayCheckinMeta = todayCheckin ? EMOTION_META[todayCheckin.emotion_type] : undefined;
  const hasCheckIn = Boolean(todayCheckin);

  const { homeTitle, hasActions, actions, toggleAction, weekLabels, weekIntensities } =
    useHomeMock();

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
              <View className={HomeSpeechBubbleClasses.shell}>
                <ThemedText type="small" className="text-fg-default">
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
              {hasCheckIn && todayCheckin && todayCheckinMeta ? (
                <CheckinSummaryRow
                  emotionIcon={todayCheckinMeta.image}
                  emotionName={todayCheckinMeta.label}
                  intensity={todayCheckin.condition_score}
                  memo={todayCheckin.memo}
                  time={formatCheckinTime(todayCheckin.created_at)}
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
                <View className={HomeActionClasses.mindExploreCta}>
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
