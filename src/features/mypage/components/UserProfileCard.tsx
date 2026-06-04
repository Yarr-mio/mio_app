import UserIcon from '@/assets/icons/user.svg';
import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { Label } from '@/components/ui/Label';
import { SettingsLayout } from '@/constants/theme';
import { ProfileAvatarCircle } from '@/features/mypage/components/ProfileAvatarCircle';
import { Pressable, View } from 'react-native';

interface UserProfileCardProps {
  nickname: string;
  characterLabel: string;
  joinedAtLabel: string;
  onEditPress: () => void;
}

export function UserProfileCard({
  nickname,
  characterLabel,
  joinedAtLabel,
  onEditPress,
}: UserProfileCardProps) {
  return (
    <BaseCard className="flex-row items-center px-6 py-6 mt-6">
      <ProfileAvatarCircle>
        <UserIcon width={SettingsLayout.userIconSize} height={SettingsLayout.userIconSize} />
      </ProfileAvatarCircle>

      <View className="ml-3 flex-1 gap-2">
        <ThemedText type="smallTitle" className="text-fg-default text-lg">
          {nickname}
        </ThemedText>
        <View className="flex-row gap-2 items-center">
          <Label label={characterLabel} />
          <ThemedText type="smallMedium" className="text-badge">
            {joinedAtLabel}
          </ThemedText>
        </View>
      </View>

      <Pressable
        onPress={onEditPress}
        accessibilityRole="button"
        accessibilityLabel="프로필 수정"
        hitSlop={8}
        className="px-2"
      >
        <ThemedText type="default" className="text-settings-edit">
          수정
        </ThemedText>
      </Pressable>
    </BaseCard>
  );
}
