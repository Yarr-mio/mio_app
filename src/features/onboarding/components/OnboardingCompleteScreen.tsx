import { NotificationIcon } from '@/assets/icons';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { AppModal } from '@/components/ui/AppModal';
import { Button } from '@/components/ui/Button';
import { getOnboardingCharacterById } from '@/constants/characters';
import { NOTIFICATION_MODAL, NotificationModalColors } from '@/constants/notifications';
import { AUTH_ROUTES } from '@/constants/routes';
import { AppModalLayout, OnboardingCompleteLayout, ScreenSpacing } from '@/constants/theme';
import { useEnsurePushNotificationReady } from '@/features/notifications/hooks/useEnsurePushNotificationReady';
import { useOnboardingCompleteSubmit } from '@/features/onboarding/hooks/useOnboardingCompleteSubmit';
import { useOnboardingNotificationAgree } from '@/features/onboarding/hooks/useOnboardingNotificationAgree';
import { useOnboardingNotificationLater } from '@/features/onboarding/hooks/useOnboardingNotificationLater';
import { useSelectedCharacterId } from '@/hooks/useSelectedCharacterId';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function OnboardingCompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const characterId = useSelectedCharacterId();
  const character = getOnboardingCharacterById(characterId);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [signupCompleted, setSignupCompleted] = useState(false);
  const [notificationPending, setNotificationPending] = useState(false);
  const { ensureReady } = useEnsurePushNotificationReady();
  const { mutateAsync: enableNotificationSettings } = useOnboardingNotificationAgree();
  const { mutateAsync: declineNotificationSettings } = useOnboardingNotificationLater();
  const { submit, isPending, error, clearError } = useOnboardingCompleteSubmit({
    onSuccess: () => {
      setSignupCompleted(true);
      setNotificationModalVisible(true);
    },
  });

  const handleStart = () => {
    if (signupCompleted) {
      router.replace(AUTH_ROUTES.home);
      return;
    }

    clearError();
    void submit();
  };

  const handleNotificationConfirm = () => {
    if (notificationPending) {
      return;
    }

    setNotificationPending(true);
    void (async () => {
      try {
        // 권한 요청 및 디바이스 등록
        await ensureReady();
        // 알림 설정 전체 활성화
        await enableNotificationSettings();
      } catch (notificationError) {
        console.warn('[OnboardingCompleteNotification]', notificationError);
      } finally {
        setNotificationPending(false);
        setNotificationModalVisible(false);
        router.replace(AUTH_ROUTES.home);
      }
    })();
  };

  const handleNotificationLater = () => {
    if (notificationPending) {
      return;
    }

    setNotificationModalVisible(false);
    void declineNotificationSettings()
      .catch(() => {
        // 설정 저장 실패 시 홈 이동
      })
      .finally(() => {
        router.replace(AUTH_ROUTES.home);
      });
  };

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground />

      <View
        className="flex-1 px-8 mt-6"
        style={{
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, ScreenSpacing.bottomInsetMin),
        }}
      >
        <View className="flex-1">
          <View className="mt-10">
            <ThemedText type="subtitle" className="text-fg">
              반가워요!
            </ThemedText>
            <ThemedText type="title" className="mt-2 text-fg">
              {character.name}와 함께{'\n'}여정을 떠나 볼까요?
            </ThemedText>
          </View>

          <View className="mt-20 items-center">
            <Image
              source={character.iconImage}
              style={{
                width: OnboardingCompleteLayout.characterIconSize,
                height: OnboardingCompleteLayout.characterIconSize,
              }}
              contentFit="contain"
            />
          </View>

          <View className="mt-16">
            <View className="rounded-card border-2 border-sub-tab-inactive-border bg-sub-tab-inactive-bg p-8">
              <ThemedText type="smallTitle" className="text-fg-default">
                {character.greeting}
              </ThemedText>
            </View>
          </View>
        </View>

        <View className="pt-4 gap-2">
          {error ? <ErrorState message={error} /> : null}
          <Button disabled={isPending} onPress={handleStart}>
            {character.name}와 시작하기
          </Button>
        </View>
      </View>

      <AppModal
        visible={notificationModalVisible}
        onClose={handleNotificationLater}
        icon={
          <NotificationIcon
            width={AppModalLayout.iconSize}
            height={AppModalLayout.iconSize}
            color={NotificationModalColors.icon}
          />
        }
        iconBgColor={NotificationModalColors.iconBg}
        iconBorderColor={NotificationModalColors.iconBorder}
        title={NOTIFICATION_MODAL.title(character.name)}
        description={NOTIFICATION_MODAL.description(character.name)}
        confirmLabel={NOTIFICATION_MODAL.confirmLabel}
        onConfirm={handleNotificationConfirm}
        cancelLabel={NOTIFICATION_MODAL.cancelLabel}
        onCancel={handleNotificationLater}
      />
    </View>
  );
}
