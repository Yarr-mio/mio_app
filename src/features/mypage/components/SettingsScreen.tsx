import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedText } from '@/components/themed/ThemedText';
import { DefaultBackground } from '@/components/ui/DefaultBackground';
import { getPartnerByKey } from '@/constants/characters';
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
import type { CheckinTime, NotificationSettingsUpdateParams } from '@/types/user';
import { formatJoinedAtLabel } from '@/utils/date';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

function isEnablingNotificationSettings(params: NotificationSettingsUpdateParams): boolean {
  return (
    params.checkin_enabled === true ||
    params.character_enabled === true ||
    params.report_enabled === true
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
          const ready = await ensureReady();
          if (!ready) {
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
    </View>
  );
}
