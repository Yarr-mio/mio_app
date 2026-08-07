import { PUSH_PERMISSION_TRIGGER } from '@/analytics/events';
import { trackPushPermissionResultFromCurrentStatus } from '@/analytics/pushPermission';
import { track } from '@/analytics/track';
import { NotificationIcon } from '@/assets/icons';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { AppModal } from '@/components/ui/AppModal';
import { Button } from '@/components/ui/Button';
import { getOnboardingCharacterById } from '@/constants/characters';
import { NOTIFICATION_MODAL, NotificationModalColors } from '@/constants/notifications';
import { AUTH_ROUTES } from '@/constants/routes';
import { SIGNUP_COMPLETE_COPY } from '@/constants/signup';
import { AppModalLayout, OnboardingCompleteLayout, ScreenSpacing } from '@/constants/theme';
import { useSignupCompleteSubmit } from '@/features/auth/hooks/useSignupCompleteSubmit';
import { useSignupNotificationAgree } from '@/features/auth/hooks/useSignupNotificationAgree';
import { useSignupNotificationLater } from '@/features/auth/hooks/useSignupNotificationLater';
import { useEnsurePushNotificationReady } from '@/features/notifications/hooks/useEnsurePushNotificationReady';
import { useSelectedCharacterId } from '@/hooks/useSelectedCharacterId';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function SignUpCompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const characterId = useSelectedCharacterId();
  const character = getOnboardingCharacterById(characterId);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [signupCompleted, setSignupCompleted] = useState(false);
  const [notificationPending, setNotificationPending] = useState(false);
  // ⚠️ push_permission_prompted는 §3-B dedup 대상이 아니라 뒷단이 중복을 접어 주지 않는다 —
  // 모달 1회 노출당 정확히 1건이 되도록 컴포넌트에서 가드한다
  const promptTrackedRef = useRef(false);
  // ⚠️ 모달 액션은 state가 아니라 ref로 잠근다 — setState는 리렌더 뒤에야 반영돼 같은 틱의
  // 재진입을 못 막고, push_permission_result는 §3-B dedup 대상이 아니라 뒷단이 접어주지 않는다.
  // confirm/later가 같은 잠금을 공유해야 confirm이 모달을 닫으며 onClose로 later를 부르는 경로도 막힌다
  const notificationActionStartedRef = useRef(false);
  const { ensureReady } = useEnsurePushNotificationReady();
  const { mutateAsync: enableNotificationSettings } = useSignupNotificationAgree();
  const { mutateAsync: declineNotificationSettings } = useSignupNotificationLater();
  const { submit, isPending, error, clearError } = useSignupCompleteSubmit({
    onSuccess: () => {
      setSignupCompleted(true);
      setNotificationModalVisible(true);

      if (!promptTrackedRef.current) {
        promptTrackedRef.current = true;
        track('push_permission_prompted', { trigger: PUSH_PERMISSION_TRIGGER.signupFlow });
      }
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
    if (notificationPending || notificationActionStartedRef.current) {
      return;
    }

    notificationActionStartedRef.current = true;
    setNotificationPending(true);
    void (async () => {
      try {
        // 권한 요청 및 디바이스 등록
        await ensureReady();
        // ensureReady가 결과를 삼키므로 권한 상태를 재조회해 granted를 얻는다 (읽기 전용 — 프롬프트 없음).
        // 기다리지 않는다 — 계측이 알림 설정 저장·홈 이동 순서에 끼어들면 안 된다
        trackPushPermissionResultFromCurrentStatus(PUSH_PERMISSION_TRIGGER.signupFlow);
        // 알림 설정 전체 활성화
        await enableNotificationSettings();
      } catch (notificationError) {
        console.warn('[SignUpCompleteNotification]', notificationError);
      } finally {
        setNotificationPending(false);
        setNotificationModalVisible(false);
        router.replace(AUTH_ROUTES.home);
      }
    })();
  };

  const handleNotificationLater = () => {
    if (notificationPending || notificationActionStartedRef.current) {
      return;
    }

    notificationActionStartedRef.current = true;

    // ⚠️ 「나중에」도 결과다. 빠뜨리면 5행 완료율의 분모가 「확인」을 누른 사람으로 줄어 동의율이 부푼다
    track('push_permission_result', {
      granted: false,
      trigger: PUSH_PERMISSION_TRIGGER.signupFlow,
    });

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
              {SIGNUP_COMPLETE_COPY.greeting}
            </ThemedText>
            <ThemedText type="title" className="mt-2 text-fg">
              {SIGNUP_COMPLETE_COPY.title(character.name)}
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
            {SIGNUP_COMPLETE_COPY.startButton(character.name)}
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
