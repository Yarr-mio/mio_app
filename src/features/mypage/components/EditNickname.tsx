import { CloseIcon } from '@/assets/icons';
import UserIcon from '@/assets/icons/user.svg';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackHeader } from '@/components/layout/BackHeader';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { DefaultBackground } from '@/components/ui/DefaultBackground';
import {
  EditNicknameClasses,
  EditNicknameLayout,
  FgColors,
  InputColors,
  PressableConfig,
  ScreenSpacing,
} from '@/constants/theme';
import { ProfileAvatarCircle } from '@/features/mypage/components/ProfileAvatarCircle';
import { useUserStore } from '@/store/userStore';

const { avatarSize, userIconSize, maxLength, clearIconSize } = EditNicknameLayout;

export function EditNicknameScreen() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const signupInfo = useUserStore((state) => state.signupInfo);
  const updateNickname = useUserStore((state) => state.updateNickname);
  const [nickname, setNickname] = useState(signupInfo?.nickname ?? '');

  const trimmedNickname = nickname.trim();
  const initialNickname = signupInfo?.nickname ?? '';
  const canSave = trimmedNickname.length > 0 && trimmedNickname !== initialNickname;
  const bottomPadding = Math.max(bottom, ScreenSpacing.bottomInsetMin);

  const handleNicknameChange = (text: string) => {
    setNickname(text.slice(0, maxLength));
  };

  const handleClear = () => {
    setNickname('');
  };

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    updateNickname(trimmedNickname);
    router.back();
  };

  return (
    <View className="flex-1">
      <DefaultBackground />
      <BackHeader title="닉네임 수정" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="grow px-6 pt-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center">
          <ProfileAvatarCircle size={avatarSize}>
            <UserIcon width={userIconSize} height={userIconSize} />
          </ProfileAvatarCircle>
        </View>

        <View className="mt-8 gap-3">
          <ThemedText type="smallTitle" className="text-label">
            닉네임
          </ThemedText>

          <View className="h-16 flex-row items-center rounded-2xl border border-line bg-surface px-4">
            <TextInput
              value={nickname}
              onChangeText={handleNicknameChange}
              placeholder="닉네임을 입력해 주세요"
              placeholderTextColor={InputColors.placeholder}
              className="flex-1 text-base font-medium text-fg"
              accessibilityLabel="닉네임"
            />
            {nickname.length > 0 ? (
              <Pressable
                onPress={handleClear}
                accessibilityRole="button"
                accessibilityLabel="닉네임 초기화"
                hitSlop={PressableConfig.hitSlop}
                className={EditNicknameClasses.clearButton}
              >
                <CloseIcon width={clearIconSize} height={clearIconSize} color={FgColors.faint} />
              </Pressable>
            ) : null}
          </View>

          <View className="flex-row items-center justify-between px-2">
            <ThemedText type="smallRegular" className="text-label">
              닉네임 설정은 최대 {maxLength}자까지 가능해요
            </ThemedText>
            <ThemedText type="smallRegular" className="text-label">
              {nickname.length}/{maxLength}
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* safe area 대응 — 인라인 style 불가피 */}
      <View className="px-6 pt-2" style={{ paddingBottom: bottomPadding }}>
        <Button disabled={!canSave} onPress={handleSave}>
          저장
        </Button>
      </View>
    </View>
  );
}
