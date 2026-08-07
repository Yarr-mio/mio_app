import { PUSH_PERMISSION_TRIGGER } from '@/analytics/events';
import { trackPushPermissionResultFromCurrentStatus } from '@/analytics/pushPermission';
import { track } from '@/analytics/track';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedText } from '@/components/themed/ThemedText';
import { AppModal } from '@/components/ui/AppModal';
import { DefaultBackground } from '@/components/ui/DefaultBackground';
import { getPartnerByKey } from '@/constants/characters';
import {
  NOTIFICATION_PERMISSION_DENIED_MODAL,
  NOTIFICATION_SETTINGS_ALL_DISABLED,
} from '@/constants/notifications';
import { MAIN_ROUTES } from '@/constants/routes';
import { FALLBACK_NICKNAME } from '@/constants/user';
import { AccountSection } from '@/features/mypage/components/AccountSection';
import { AiPartnerCard } from '@/features/mypage/components/AiPartnerCard';
import { LegalInfoSection } from '@/features/mypage/components/LegalInfoSection';
import { NotificationCard } from '@/features/mypage/components/NotificationCard';
import { UserProfileCard } from '@/features/mypage/components/UserProfileCard';
import { useEnsurePushNotificationReady } from '@/features/notifications/hooks/useEnsurePushNotificationReady';
import {
  useMyPage,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/features/mypage/hooks/useMypage';
import { useSelectedCharacterId } from '@/hooks/useSelectedCharacterId';
import { getNotificationPermissionGrantedAsync } from '@/notifications/fcm';
import type { CheckinTime, NotificationSettingsUpdateParams } from '@/types/user';
import { formatJoinedAtLabel } from '@/utils/date';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState, Linking, ScrollView, View } from 'react-native';

function isEnablingNotificationSettings(params: NotificationSettingsUpdateParams): boolean {
  return (
    params.checkin_enabled === true ||
    params.character_enabled === true ||
    params.report_enabled === true
  );
}

function hasAnyNotificationEnabled(settings: {
  checkin_enabled: boolean;
  character_enabled: boolean;
  report_enabled: boolean;
}): boolean {
  return (
    settings.checkin_enabled === true ||
    settings.character_enabled === true ||
    settings.report_enabled === true
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const { data: myPageData } = useMyPage();
  const { data: notificationSettings, isPending: isNotificationSettingsPending } =
    useNotificationSettings();
  const { mutateAsync: updateNotificationSettings, isPending: isNotificationUpdatePending } =
    useUpdateNotificationSettings();
  const { ensureReady } = useEnsurePushNotificationReady();
  const [isNotificationUpdateLocked, setIsNotificationUpdateLocked] = useState(false);
  const [permissionDeniedModalVisible, setPermissionDeniedModalVisible] = useState(false);
  const isNotificationUpdateInFlightRef = useRef(false);

  const selectedCharacterId = useSelectedCharacterId();
  const partner = getPartnerByKey(selectedCharacterId);

  const nickname = myPageData?.nickname ?? FALLBACK_NICKNAME;
  const characterLabel = `${partner.name}와 함께`;

  const joinedAtLabel = myPageData?.joined_at
    ? formatJoinedAtLabel(myPageData.joined_at)
    : undefined;

  const allNotificationsEnabled =
    notificationSettings?.checkin_enabled === true &&
    notificationSettings?.character_enabled === true &&
    notificationSettings?.report_enabled === true;

  const checkinEnabled = notificationSettings?.checkin_enabled === true;
  const characterEnabled = notificationSettings?.character_enabled === true;
  const reportEnabled = notificationSettings?.report_enabled === true;

  const isNotificationToggleDisabled =
    isNotificationUpdatePending ||
    isNotificationUpdateLocked ||
    isNotificationSettingsPending ||
    !notificationSettings;

  const closePermissionDeniedModal = () => {
    setPermissionDeniedModalVisible(false);
  };

  const openSystemSettings = () => {
    closePermissionDeniedModal();
    void Linking.openSettings();
  };

  // OS 권한 denied인데 서버가 true면 전체 OFF로 맞춤
  const syncSettingsWithOsPermission = useCallback(async () => {
    if (!notificationSettings || isNotificationUpdateInFlightRef.current) {
      return;
    }

    if (!hasAnyNotificationEnabled(notificationSettings)) {
      return;
    }

    const granted = await getNotificationPermissionGrantedAsync();
    if (granted) {
      return;
    }

    isNotificationUpdateInFlightRef.current = true;
    setIsNotificationUpdateLocked(true);

    try {
      await updateNotificationSettings(NOTIFICATION_SETTINGS_ALL_DISABLED);
      setPermissionDeniedModalVisible(true);
    } finally {
      isNotificationUpdateInFlightRef.current = false;
      setIsNotificationUpdateLocked(false);
    }
  }, [notificationSettings, updateNotificationSettings]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const runSync = () => {
        if (cancelled) {
          return;
        }
        void syncSettingsWithOsPermission();
      };

      runSync();

      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          runSync();
        }
      });

      return () => {
        cancelled = true;
        subscription.remove();
      };
    }, [syncSettingsWithOsPermission])
  );

  const handleNotificationUpdate = (params: NotificationSettingsUpdateParams) => {
    if (
      isNotificationUpdatePending ||
      isNotificationUpdateLocked ||
      isNotificationUpdateInFlightRef.current
    ) {
      return;
    }

    isNotificationUpdateInFlightRef.current = true;
    setIsNotificationUpdateLocked(true);

    void (async () => {
      try {
        if (isEnablingNotificationSettings(params)) {
          // trigger를 signup_flow와 나누지 않으면 퍼널 분모가 설정 재동의로 부풂
          track('push_permission_prompted', { trigger: PUSH_PERMISSION_TRIGGER.settings });
          const result = await ensureReady();
          // 계측이 설정 PATCH 전송 순서에 끼어들지 않음
          trackPushPermissionResultFromCurrentStatus(PUSH_PERMISSION_TRIGGER.settings);

          if (result === 'permission_denied') {
            // denied 시 true PATCH 금지 및 토글 OFF 유지함
            setPermissionDeniedModalVisible(true);
            return;
          }
        }

        await updateNotificationSettings(params);
      } finally {
        isNotificationUpdateInFlightRef.current = false;
        setIsNotificationUpdateLocked(false);
      }
    })();
  };

  const handleAllNotificationsToggle = (value: boolean) => {
    handleNotificationUpdate({
      checkin_enabled: value,
      character_enabled: value,
      report_enabled: value,
    });
  };

  const checkinTime = notificationSettings?.checkin_time;

  const handleCheckinTimeChange = (slot: keyof CheckinTime, time: string) => {
    handleNotificationUpdate({ checkin_time: { [slot]: time } });
  };

  const handleCheckinToggle = (value: boolean) => {
    handleNotificationUpdate({ checkin_enabled: value });
  };

  const handleCharacterToggle = (value: boolean) => {
    handleNotificationUpdate({ character_enabled: value });
  };

  const handleReportToggle = (value: boolean) => {
    handleNotificationUpdate({ report_enabled: value });
  };

  return (
    <View className="flex-1">
      <DefaultBackground />

      <ScreenContainer className="bg-transparent">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pb-6 mt-5"
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="pageTitle" className="py-4 text-fg">
            더보기
          </ThemedText>

          <UserProfileCard
            nickname={nickname}
            characterLabel={characterLabel}
            joinedAtLabel={joinedAtLabel}
            onEditPress={() => router.push(MAIN_ROUTES.editNickname)}
          />

          <View className="mt-6">
            <ThemedText type="smallTitle" className="mb-2 text-badge">
              내 AI 파트너
            </ThemedText>
            <AiPartnerCard
              characterName={partner.name}
              characterIntro={partner.tag}
              characterImage={partner.image}
              onChevronPress={() => router.push(MAIN_ROUTES.partner)}
            />
          </View>

          <View className="mt-6">
            <ThemedText type="smallTitle" className="mb-2 text-badge">
              알림
            </ThemedText>
            <NotificationCard
              allEnabled={allNotificationsEnabled}
              checkinEnabled={checkinEnabled}
              checkinTime={checkinTime}
              characterEnabled={characterEnabled}
              reportEnabled={reportEnabled}
              disabled={isNotificationToggleDisabled}
              onToggleAll={handleAllNotificationsToggle}
              onToggleCheckin={handleCheckinToggle}
              onCheckinTimeChange={handleCheckinTimeChange}
              onToggleCharacter={handleCharacterToggle}
              onToggleReport={handleReportToggle}
            />
          </View>

          <View className="mt-6">
            <ThemedText type="smallTitle" className="mb-2 text-badge">
              안내
            </ThemedText>
            <LegalInfoSection />
          </View>

          <View className="mt-6">
            <ThemedText type="smallTitle" className="mb-2 text-badge">
              계정
            </ThemedText>
            <AccountSection />
          </View>
        </ScrollView>
      </ScreenContainer>

      <AppModal
        visible={permissionDeniedModalVisible}
        onClose={closePermissionDeniedModal}
        title={NOTIFICATION_PERMISSION_DENIED_MODAL.title}
        description={NOTIFICATION_PERMISSION_DENIED_MODAL.description}
        confirmLabel={NOTIFICATION_PERMISSION_DENIED_MODAL.confirmLabel}
        cancelLabel={NOTIFICATION_PERMISSION_DENIED_MODAL.cancelLabel}
        onConfirm={openSystemSettings}
        onCancel={closePermissionDeniedModal}
      />
    </View>
  );
}
