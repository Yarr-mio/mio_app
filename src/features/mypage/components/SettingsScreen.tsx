import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedText } from '@/components/themed/ThemedText';
import { DefaultBackground } from '@/components/ui/DefaultBackground';
import { getPartnerByKey } from '@/constants/characters';
import { MAIN_ROUTES } from '@/constants/routes';
import { AccountSection } from '@/features/mypage/components/AccountSection';
import { AiPartnerCard } from '@/features/mypage/components/AiPartnerCard';
import { LegalInfoSection } from '@/features/mypage/components/LegalInfoSection';
import { NotificationCard } from '@/features/mypage/components/NotificationCard';
import { UserProfileCard } from '@/features/mypage/components/UserProfileCard';
import { useSelectedCharacterId, useSelectedNickname } from '@/hooks/useSelectedCharacterId';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

const FALLBACK_NICKNAME = '사용자';
// TODO: userStore에 joinedAt 추가 필요
const FALLBACK_JOINED_AT = '2026-01-01';

export function SettingsScreen() {
  const router = useRouter();
  const nickname = useSelectedNickname() ?? FALLBACK_NICKNAME;
  const [pushEnabled, setPushEnabled] = useState(true);

  const selectedCharacterId = useSelectedCharacterId();
  const partner = getPartnerByKey(selectedCharacterId);

  // TODO: userStore에 joinedAt 추가 필요
  const joinedAt = FALLBACK_JOINED_AT;
  const joinedAtLabel = `${format(parseISO(joinedAt), 'yyyy-MM-dd')} 시작`;

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
            characterLabel={`${partner.name}와 함께`}
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
            <NotificationCard enabled={pushEnabled} onToggle={setPushEnabled} />
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
