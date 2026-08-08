import { CheckinSummaryRow } from '@/components/checkin/CheckinSummaryRow';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { HomeReportBackground } from '@/components/themed/HomeReportBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { AppModal } from '@/components/ui/AppModal';
import { HomeCardShell } from '@/components/ui/HomeCardShell';
import { getPartnerByKey } from '@/constants/characters';
import { EMOTION_META } from '@/constants/emotions';
import {
  HOME_MIND_EXPLORE_COMING_SOON_MODAL,
  HOME_RECOMMENDED_ACTIONS_TITLE,
  HOME_RECOMMENDED_ACTIONS_VIEW_ALL_LABEL,
  HOME_SPEECH_BUBBLE_MESSAGES,
  HOME_TITLES,
} from '@/constants/home';
import { HOME_ROUTES } from '@/constants/routes';
import {
  ButtonColors,
  HomeActionClasses,
  HomeCardClasses,
  HomeLayout,
  HomeSpeechBubbleClasses,
  HomeTextClasses,
} from '@/constants/theme';
import { FALLBACK_NICKNAME } from '@/constants/user';
import { useCheckinToday } from '@/features/checkin/hooks/useCheckin';
import { HomeRecommendedActionsList } from '@/features/home/components/HomeRecommendedActionsList';
import { useHomeRecommendedTodoCheckin } from '@/features/home/hooks/useHomeRecommendedTodoCheckin';
import { EmotionConstellationPreview } from '@/features/report/components/EmotionConstellation';
import { useTodos } from '@/features/todo/hooks/useTodo';
import { useSelectedCharacterId, useSelectedNickname } from '@/hooks/useSelectedCharacterId';
import type { CheckinRecord } from '@/types/checkin';
import { cn } from '@/utils/cn';
import { formatCheckinTime, getDateIso } from '@/utils/date';
import { pickRandomItem } from '@/utils/random';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

function getLatestTodayCheckin(checkins: CheckinRecord[]): CheckinRecord | undefined {
  if (checkins.length === 0) {
    return undefined;
  }

  return checkins.reduce((latest, current) =>
    current.created_at > latest.created_at ? current : latest
  );
}

export function HomeScreen() {
  const nickname = useSelectedNickname() ?? FALLBACK_NICKNAME;
  const selectedCharacterId = useSelectedCharacterId();
  const partner = getPartnerByKey(selectedCharacterId);

  const { data: todayCheckinData } = useCheckinToday();
  const todayCheckin = getLatestTodayCheckin(todayCheckinData?.checkins ?? []);
  const todayCheckinMeta = todayCheckin ? EMOTION_META[todayCheckin.emotion_type] : undefined;
  const hasCheckIn = Boolean(todayCheckin);
  const homeTitle = hasCheckIn ? HOME_TITLES.checkedIn : HOME_TITLES.notCheckedIn;

  const {
    data: todayTodos,
    isPending: isTodayTodosPending,
    refetch: refetchTodayTodos,
  } = useTodos(getDateIso(new Date()));
  const { completeTodo, isSubmitting: isHomeTodoSubmitting } = useHomeRecommendedTodoCheckin();
  // React Compiler opt-out useHomeRecommendedTodoDisplay allTodos 참조 안정화
  const recommendedTodos = useMemo(() => todayTodos ?? [], [todayTodos]);
  const hasActions = recommendedTodos.length > 0;

  const [speechBubbleMessage, setSpeechBubbleMessage] = useState(() =>
    pickRandomItem(HOME_SPEECH_BUBBLE_MESSAGES)
  );
  const [mindExploreModalVisible, setMindExploreModalVisible] = useState(false);

  useFocusEffect(() => {
    setSpeechBubbleMessage(pickRandomItem(HOME_SPEECH_BUBBLE_MESSAGES));
    refetchTodayTodos();
  });

  const closeMindExploreModal = () => {
    setMindExploreModalVisible(false);
  };

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
                <ThemedText
                  type="small"
                  className={cn('text-fg-default', HomeSpeechBubbleClasses.messageText)}
                >
                  {speechBubbleMessage}
                </ThemedText>
              </View>
            </View>
            <View className="self-end">
              <Image
                source={partner.image}
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
              onHeaderActionPress={() => router.push(HOME_ROUTES.checkin)}
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
              title={HOME_RECOMMENDED_ACTIONS_TITLE}
              headerActionLabel={HOME_RECOMMENDED_ACTIONS_VIEW_ALL_LABEL}
              onHeaderActionPress={() => router.push(HOME_ROUTES.todo)}
              headerContainerClassName="mb-5"
              contentClassName={HomeCardClasses.recommendedActionsContent}
            >
              {isTodayTodosPending ? (
                <View className={HomeCardClasses.recommendedActionsEmptyState}>
                  <ActivityIndicator color={ButtonColors.spinnerLight} />
                </View>
              ) : hasActions ? (
                <HomeRecommendedActionsList
                  actions={recommendedTodos}
                  isSubmitting={isHomeTodoSubmitting}
                  onCompleteTodo={completeTodo}
                />
              ) : (
                <View className={HomeCardClasses.recommendedActionsEmptyState}>
                  <ThemedText type="small" className="text-label">
                    등록된 추천 행동이 없어요
                  </ThemedText>
                </View>
              )}
            </HomeCardShell>

            <HomeCardShell
              title="감정 별자리"
              headerActionLabel="자세히"
              onHeaderActionPress={() => router.push(HOME_ROUTES.report)}
            >
              <EmotionConstellationPreview />
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
                {/* 마음 탐색 준비중 안내 모달 연결함 */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="테스트 시작"
                  onPress={() => setMindExploreModalVisible(true)}
                  className={HomeActionClasses.mindExploreCta}
                >
                  <ThemedText type="smallBold" className="text-fg-default">
                    테스트 시작
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>

      <AppModal
        visible={mindExploreModalVisible}
        onClose={closeMindExploreModal}
        title={HOME_MIND_EXPLORE_COMING_SOON_MODAL.title}
        description={HOME_MIND_EXPLORE_COMING_SOON_MODAL.description}
        confirmLabel={HOME_MIND_EXPLORE_COMING_SOON_MODAL.confirmLabel}
        onConfirm={closeMindExploreModal}
      />
    </View>
  );
}
