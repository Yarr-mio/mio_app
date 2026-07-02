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
import {
  useMyPage,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/features/mypage/hooks/useMypage';
import { useSelectedCharacterId } from '@/hooks/useSelectedCharacterId';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

const JOINED_AT_PLACEHOLDER = '확인 중';

export function SettingsScreen() {
  const router = useRouter();
  const { data: myPageData } = useMyPage();
  const { data: notificationSettings } = useNotificationSettings();
  const { mutate: updateNotificationSettings, isPending: isNotificationUpdatePending } =
    useUpdateNotificationSettings();

  const selectedCharacterId = useSelectedCharacterId();
  const partner = getPartnerByKey(selectedCharacterId);

  const nickname = myPageData?.nickname ?? FALLBACK_NICKNAME;
  const characterLabel = myPageData
    ? `${myPageData.preferred_character.name}와 함께`
    : `${partner.name}와 함께`;

  const joinedAtLabel = JOINED_AT_PLACEHOLDER;

  const pushEnabled =
    notificationSettings?.checkin_enabled === true &&
    notificationSettings?.character_enabled === true &&
    notificationSettings?.report_enabled === true;

  const handlePushToggle = (value: boolean) => {
    if (isNotificationUpdatePending) {
      return;
    }
    updateNotificationSettings({
      checkin_enabled: value,
      character_enabled: value,
      report_enabled: value,
    });
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
              enabled={pushEnabled}
              disabled={isNotificationUpdatePending}
              onToggle={handlePushToggle}
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
