import { CloseIcon } from '@/assets/icons';
import UserIcon from '@/assets/icons/user.svg';
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
  NicknameDuplicateCheckClasses,
  PressableConfig,
  ScreenSpacing,
  SignupInfoLayout,
} from '@/constants/theme';
import { ProfileAvatarCircle } from '@/features/mypage/components/ProfileAvatarCircle';
import { useEditNickname } from '@/features/mypage/hooks/useEditNickname';
import { cn } from '@/utils/cn';

const { avatarSize, userIconSize, maxLength, clearIconSize } = EditNicknameLayout;
const NICKNAME_MAX_LENGTH = SignupInfoLayout.nicknameMaxLength;
const NICKNAME_MIN_LENGTH = SignupInfoLayout.nicknameMinLength;
const NICKNAME_HINT_DEFAULT = `닉네임은 ${NICKNAME_MIN_LENGTH}자 이상, 최대 ${NICKNAME_MAX_LENGTH}자까지 가능해요`;
const NICKNAME_HINT_DUPLICATE = '중복된 닉네임입니다';
const NICKNAME_HINT_AVAILABLE = '사용 가능한 닉네임입니다';

function resolveNicknameHintText(isDuplicateConflict: boolean, isAvailable: boolean): string {
  if (isDuplicateConflict) {
    return NICKNAME_HINT_DUPLICATE;
  }

  if (isAvailable) {
    return NICKNAME_HINT_AVAILABLE;
  }

  return NICKNAME_HINT_DEFAULT;
}

function resolveNicknameHintClassName(isDuplicateConflict: boolean, isAvailable: boolean): string {
  if (isDuplicateConflict) {
    return NicknameDuplicateCheckClasses.errorHint;
  }

  if (isAvailable) {
    return NicknameDuplicateCheckClasses.availableText;
  }

  return 'text-label';
}

export function EditNicknameScreen() {
  const { bottom } = useSafeAreaInsets();
  const {
    nickname,
    isDuplicateConflict,
    isAvailable,
    canSave,
    isPending,
    handleNicknameChange,
    handleClear,
    handleSave,
  } = useEditNickname();
  const bottomPadding = Math.max(bottom, ScreenSpacing.bottomInsetMin);

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
            <ThemedText
              type="smallRegular"
              className={cn(resolveNicknameHintClassName(isDuplicateConflict, isAvailable))}
            >
              {resolveNicknameHintText(isDuplicateConflict, isAvailable)}
            </ThemedText>
            <ThemedText type="smallRegular" className="text-label">
              {nickname.length}/{maxLength}
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* safe area 대응 — 인라인 style 불가피 */}
      <View className="px-6 pt-2" style={{ paddingBottom: bottomPadding }}>
        <Button disabled={!canSave || isPending} onPress={handleSave}>
          저장
        </Button>
      </View>
    </View>
  );
}
