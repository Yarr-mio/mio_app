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
  NOTIFICATION_SETTINGS_ALL_ENABLED,
  NOTIFICATION_TOKEN_UNAVAILABLE_MODAL,
} from '@/constants/notifications';
import { MAIN_ROUTES } from '@/constants/routes';
import { FALLBACK_NICKNAME } from '@/constants/user';
import { AccountSection } from '@/features/mypage/components/AccountSection';
import { AiPartnerCard } from '@/features/mypage/components/AiPartnerCard';
import { LegalInfoSection } from '@/features/mypage/components/LegalInfoSection';
import { NotificationCard } from '@/features/mypage/components/NotificationCard';
import { UserProfileCard } from '@/features/mypage/components/UserProfileCard';
import {
  useMyPage,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/features/mypage/hooks/useMypage';
import { useEnsurePushNotificationReady } from '@/features/notifications/hooks/useEnsurePushNotificationReady';
import { useSelectedCharacterId } from '@/hooks/useSelectedCharacterId';
import { getNotificationPermissionGrantedAsync } from '@/notifications/fcm';
import {
  getLastOsNotificationPermissionGranted,
  setLastOsNotificationPermissionGranted,
} from '@/notifications/lastOsPermissionGranted';
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

function areAllNotificationSettingsDisabled(settings: {
  checkin_enabled: boolean;
  character_enabled: boolean;
  report_enabled: boolean;
}): boolean {
  return (
    settings.checkin_enabled === false &&
    settings.character_enabled === false &&
    settings.report_enabled === false
  );
}

type NotificationReadyModal = 'permission_denied' | 'token_unavailable' | null;

export function SettingsScreen() {
  const router = useRouter();
  const { data: myPageData } = useMyPage();
  const { data: notificationSettings, isPending: isNotificationSettingsPending } =
    useNotificationSettings();
  const { mutateAsync: updateNotificationSettings, isPending: isNotificationUpdatePending } =
    useUpdateNotificationSettings();
  const { ensureReady } = useEnsurePushNotificationReady();
  const [isNotificationUpdateLocked, setIsNotificationUpdateLocked] = useState(false);
  const [readyModal, setReadyModal] = useState<NotificationReadyModal>(null);
  const isNotificationUpdateInFlightRef = useRef(false);
  // 직전 OS 권한 상태 null은 미조회 또는 저장값 없음
  const prevGrantedRef = useRef<boolean | null>(null);
  // 영속 저장소 hydrate 완료 여부
  const isPrevGrantedHydratedRef = useRef(false);
  // OS 권한 sync 중복 실행 방지
  const isOsPermissionSyncInFlightRef = useRef(false);

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

  const closeReadyModal = () => {
    setReadyModal(null);
  };

  const openSystemSettings = () => {
    closeReadyModal();
    void Linking.openSettings();
  };

  // 영속 저장소에서 직전 OS 권한 상태를 읽어 ref에 채움
  const hydratePrevGranted = useCallback(async () => {
    if (isPrevGrantedHydratedRef.current) {
      return;
    }

    const stored = await getLastOsNotificationPermissionGranted();
    prevGrantedRef.current = stored;
    isPrevGrantedHydratedRef.current = true;
  }, []);

  // OS 권한과 서버 알림 설정을 양방향으로 맞춤
  const syncSettingsWithOsPermission = useCallback(async () => {
    if (
      !notificationSettings ||
      isNotificationUpdateInFlightRef.current ||
      isOsPermissionSyncInFlightRef.current
    ) {
      return;
    }

    isOsPermissionSyncInFlightRef.current = true;

    try {
      // hydrate 전에 sync하면 전환 감지가 깨짐
      await hydratePrevGranted();

      const granted = await getNotificationPermissionGrantedAsync();
      const prevGranted = prevGrantedRef.current;
      // 조회 직후 이전 상태를 갱신해 중복 전환 감지를 막음
      prevGrantedRef.current = granted;
      await setLastOsNotificationPermissionGranted(granted);

      const anyEnabled = hasAnyNotificationEnabled(notificationSettings);
      const allDisabled = areAllNotificationSettingsDisabled(notificationSettings);

      // denied인데 서버에 true가 있으면 전체 OFF로 내림
      if (!granted && anyEnabled) {
        isNotificationUpdateInFlightRef.current = true;
        setIsNotificationUpdateLocked(true);

        try {
          await updateNotificationSettings(NOTIFICATION_SETTINGS_ALL_DISABLED);
          setReadyModal('permission_denied');
        } finally {
          isNotificationUpdateInFlightRef.current = false;
          setIsNotificationUpdateLocked(false);
        }
        return;
      }

      // denied에서 granted로 바뀐 뒤에만 서버 전체 OFF를 전체 ON으로 올림
      if (granted && prevGranted === false && allDisabled) {
        isNotificationUpdateInFlightRef.current = true;
        setIsNotificationUpdateLocked(true);

        try {
          await updateNotificationSettings(NOTIFICATION_SETTINGS_ALL_ENABLED);
        } finally {
          isNotificationUpdateInFlightRef.current = false;
          setIsNotificationUpdateLocked(false);
        }
      }
    } finally {
      isOsPermissionSyncInFlightRef.current = false;
    }
  }, [hydratePrevGranted, notificationSettings, updateNotificationSettings]);

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
            setReadyModal('permission_denied');
            return;
          }

          if (result === 'token_unavailable') {
            // 토큰 등록 실패 시 true PATCH 금지 및 토글 OFF 유지함
            setReadyModal('token_unavailable');
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
        visible={readyModal === 'permission_denied'}
        onClose={closeReadyModal}
        title={NOTIFICATION_PERMISSION_DENIED_MODAL.title}
        description={NOTIFICATION_PERMISSION_DENIED_MODAL.description}
        confirmLabel={NOTIFICATION_PERMISSION_DENIED_MODAL.confirmLabel}
        cancelLabel={NOTIFICATION_PERMISSION_DENIED_MODAL.cancelLabel}
        onConfirm={openSystemSettings}
        onCancel={closeReadyModal}
      />

      <AppModal
        visible={readyModal === 'token_unavailable'}
        onClose={closeReadyModal}
        title={NOTIFICATION_TOKEN_UNAVAILABLE_MODAL.title}
        description={NOTIFICATION_TOKEN_UNAVAILABLE_MODAL.description}
        confirmLabel={NOTIFICATION_TOKEN_UNAVAILABLE_MODAL.confirmLabel}
        onConfirm={closeReadyModal}
      />
    </View>
  );
}
