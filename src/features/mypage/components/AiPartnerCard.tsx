import ChevronRightIcon from '@/assets/icons/chevron-right.svg';
import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { SettingsLayout, SubtitleColors } from '@/constants/theme';
import { ProfileAvatarCircle } from '@/features/mypage/components/ProfileAvatarCircle';
import type { ImageSource } from 'expo-image';
import { Pressable, View } from 'react-native';

interface AiPartnerCardProps {
  characterName: string;
  characterIntro: string;
  characterImage: ImageSource;
  onPress: () => void;
}

export function AiPartnerCard({
  characterName,
  characterIntro,
  characterImage,
  onPress,
}: AiPartnerCardProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="AI 파트너 상세">
      <BaseCard className="flex-row items-center px-6 py-6">
        <ProfileAvatarCircle imageSource={characterImage} />

        <View className="ml-3 flex-1 gap-1">
          <ThemedText type="defaultBold" className="text-fg-default text-base">
            {characterName}
          </ThemedText>
          <ThemedText type="smallBold" className="text-badge">
            {characterIntro}
          </ThemedText>
        </View>

        <ChevronRightIcon
          width={SettingsLayout.chevronWidth}
          height={SettingsLayout.chevronHeight}
          color={SubtitleColors.DEFAULT}
        />
      </BaseCard>
    </Pressable>
  );
}
