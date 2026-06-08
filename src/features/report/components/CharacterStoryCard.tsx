import { CharacterAvatar } from '@/components/character/CharacterAvatar';
import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { getOnboardingCharacterById, type OnboardingCharacterId } from '@/constants/characters';
import {
  CHARACTER_STORY_COLLAPSE_LABEL,
  CHARACTER_STORY_READ_MORE_INLINE_LABEL,
  CHARACTER_STORY_READ_MORE_MIN_LENGTH,
  CHARACTER_STORY_TRUNCATE_ELLIPSIS,
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
import { getCharacterStoryMock } from '@/features/report/data/characterStoryMock';
import {
  formatCharacterStoryMonthlyDateLabel,
  formatCharacterStoryWeeklyDateLabel,
} from '@/utils/date';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

interface CharacterStoryCardProps {
  period: CharacterStoryPeriod;
  anchorDate: Date;
  characterId: OnboardingCharacterId;
}

export function CharacterStoryCard({ period, anchorDate, characterId }: CharacterStoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const character = getOnboardingCharacterById(characterId);
  const storyText = getCharacterStoryMock(characterId, period);
  const title = formatCharacterStoryCardTitle(character.name, period);
  const dateLabel =
    period === 'weekly'
      ? formatCharacterStoryWeeklyDateLabel(anchorDate)
      : formatCharacterStoryMonthlyDateLabel(anchorDate);
  const isStoryLongEnough = storyText.length > CHARACTER_STORY_READ_MORE_MIN_LENGTH;
  const collapsedStoryText = storyText.slice(0, CHARACTER_STORY_READ_MORE_MIN_LENGTH);
  const showCollapse = expanded && isStoryLongEnough;

  const handleReadMorePress = () => {
    setExpanded(true);
  };

  const handleCollapsePress = () => {
    setExpanded(false);
  };

  const renderStoryBody = () => {
    if (expanded) {
      return (
        <ThemedText type="small" className={ReportCharacterStoryClasses.storyText}>
          {storyText}
        </ThemedText>
      );
    }

    if (isStoryLongEnough) {
      return (
        <ThemedText type="small" className={ReportCharacterStoryClasses.storyText}>
          {collapsedStoryText}
          {CHARACTER_STORY_TRUNCATE_ELLIPSIS}{' '}
          <ThemedText
            type="small"
            className={ReportTextClasses.characterStoryReadMore}
            onPress={handleReadMorePress}
            accessibilityRole="button"
            accessibilityLabel="이야기 더보기"
          >
            {CHARACTER_STORY_READ_MORE_INLINE_LABEL}
          </ThemedText>
        </ThemedText>
      );
    }

    return (
      <ThemedText type="small" className={ReportCharacterStoryClasses.storyText}>
        {storyText}
      </ThemedText>
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
            accessibilityLabel="이야기 접기"
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
