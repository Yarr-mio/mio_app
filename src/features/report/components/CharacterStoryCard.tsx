import { CharacterAvatar } from '@/components/character/CharacterAvatar';
import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { getOnboardingCharacterById, type OnboardingCharacterId } from '@/constants/characters';
import {
  CHARACTER_STORY_A11Y_COLLAPSE,
  CHARACTER_STORY_A11Y_EXPAND,
  CHARACTER_STORY_BODY_SEPARATOR,
  CHARACTER_STORY_COLLAPSE_LABEL,
  CHARACTER_STORY_PERIOD_WEEKLY,
  CHARACTER_STORY_READ_MORE_INLINE_LABEL,
  CHARACTER_STORY_READ_MORE_MIN_LENGTH,
  formatCharacterStoryCardTitle,
  type CharacterStoryPeriod,
} from '@/constants/report';
import {
  PressableConfig,
  ReportCardClasses,
  ReportCharacterStoryClasses,
  ReportDividerClasses,
  ReportTextClasses,
} from '@/constants/theme';
import {
  formatCharacterStoryMonthlyDateLabel,
  formatCharacterStoryWeeklyDateLabel,
} from '@/utils/date';
import { getCharacterStoryCollapsedPreview, getCharacterStoryContentLength } from '@/utils/report';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

interface CharacterStoryCardProps {
  period: CharacterStoryPeriod;
  anchorDate: Date;
  characterId: OnboardingCharacterId;
  storyText: string;
  coachingDirection?: string | null;
}

interface StoryBodyContentProps {
  storyPortion: string;
  coachingPortion: string | null;
  showSeparator: boolean;
  readMoreLabel?: string;
  onReadMorePress?: () => void;
}

function StoryBodyContent({
  storyPortion,
  coachingPortion,
  showSeparator,
  readMoreLabel,
  onReadMorePress,
}: StoryBodyContentProps) {
  return (
    <ThemedText type="small" className={ReportCharacterStoryClasses.storyText}>
      {storyPortion}
      {showSeparator && coachingPortion ? CHARACTER_STORY_BODY_SEPARATOR : null}
      {coachingPortion ? (
        <ThemedText type="smallBold" className={ReportTextClasses.coachingDirection}>
          {coachingPortion}
        </ThemedText>
      ) : null}
      {readMoreLabel && onReadMorePress ? (
        <ThemedText
          type="small"
          className={ReportTextClasses.characterStoryReadMore}
          onPress={onReadMorePress}
          accessibilityRole="button"
          accessibilityLabel={CHARACTER_STORY_A11Y_EXPAND}
        >
          {readMoreLabel}
        </ThemedText>
      ) : null}
    </ThemedText>
  );
}

export function CharacterStoryCard({
  period,
  anchorDate,
  characterId,
  storyText,
  coachingDirection,
}: CharacterStoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const character = getOnboardingCharacterById(characterId);
  const title = formatCharacterStoryCardTitle(character.name, period);
  const dateLabel =
    period === CHARACTER_STORY_PERIOD_WEEKLY
      ? formatCharacterStoryWeeklyDateLabel(anchorDate)
      : formatCharacterStoryMonthlyDateLabel(anchorDate);

  // 이야기와 코칭 방향 문자 수 합으로 접기 여부 판단
  const contentLength = getCharacterStoryContentLength(storyText, coachingDirection);
  const isContentLongEnough = contentLength > CHARACTER_STORY_READ_MORE_MIN_LENGTH;
  const showCollapse = expanded && isContentLongEnough;
  const hasCoachingDirection = Boolean(coachingDirection);

  const handleReadMorePress = () => {
    setExpanded(true);
  };

  const handleCollapsePress = () => {
    setExpanded(false);
  };

  const renderStoryBody = () => {
    if (expanded || !isContentLongEnough) {
      return (
        <StoryBodyContent
          storyPortion={storyText}
          coachingPortion={hasCoachingDirection ? (coachingDirection ?? null) : null}
          showSeparator={storyText.length > 0 && hasCoachingDirection}
        />
      );
    }

    const collapsedPreview = getCharacterStoryCollapsedPreview(storyText, coachingDirection);

    return (
      <StoryBodyContent
        storyPortion={collapsedPreview.storyPortion}
        coachingPortion={collapsedPreview.coachingPortion}
        showSeparator={collapsedPreview.showSeparator}
        readMoreLabel={CHARACTER_STORY_READ_MORE_INLINE_LABEL}
        onReadMorePress={handleReadMorePress}
      />
    );
  };

  return (
    <BaseCard className={ReportCardClasses.body}>
      {/* 상단 헤더 영역 */}
      <View className={ReportCharacterStoryClasses.header}>
        <View className={ReportCharacterStoryClasses.profileImage}>
          <CharacterAvatar characterId={characterId} size="xs" background />
        </View>

        <View className={ReportCharacterStoryClasses.headerText}>
          <ThemedText type="default" className={ReportTextClasses.characterStoryTitle}>
            {title}
          </ThemedText>
          <ThemedText type="smallRegular" className={ReportTextClasses.characterStoryDate}>
            {dateLabel}
          </ThemedText>
        </View>
      </View>

      {/* 구분선 */}
      <View className={ReportCharacterStoryClasses.divider}>
        <View className={ReportDividerClasses.line} />
      </View>

      {/* 이야기 본문 */}
      <View className={ReportCharacterStoryClasses.storyBody}>
        {renderStoryBody()}

        {showCollapse ? (
          <Pressable
            onPress={handleCollapsePress}
            accessibilityRole="button"
            accessibilityLabel={CHARACTER_STORY_A11Y_COLLAPSE}
            hitSlop={PressableConfig.hitSlop}
          >
            <ThemedText type="small" className={ReportTextClasses.characterStoryReadMore}>
              {CHARACTER_STORY_COLLAPSE_LABEL}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </BaseCard>
  );
}
