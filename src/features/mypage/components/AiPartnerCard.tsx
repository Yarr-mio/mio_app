import ChevronRightIcon from '@/assets/icons/chevron-right.svg';
import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { PressableConfig, SettingsLayout, SubtitleColors } from '@/constants/theme';
import { ProfileAvatarCircle } from '@/features/mypage/components/ProfileAvatarCircle';
import type { ImageSource } from 'expo-image';
import { Pressable, View } from 'react-native';

interface AiPartnerCardProps {
  characterName: string;
  characterIntro: string;
  characterImage: ImageSource;
  onChevronPress: () => void;
}

export function AiPartnerCard({
  characterName,
  characterIntro,
  characterImage,
  onChevronPress,
}: AiPartnerCardProps) {
  return (
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

      <Pressable
        onPress={onChevronPress}
        accessibilityRole="button"
        accessibilityLabel="파트너 변경"
        hitSlop={PressableConfig.hitSlop}
      >
        <ChevronRightIcon
          width={SettingsLayout.chevronWidth}
          height={SettingsLayout.chevronHeight}
          color={SubtitleColors.DEFAULT}
        />
      </Pressable>
    </BaseCard>
  );
}
