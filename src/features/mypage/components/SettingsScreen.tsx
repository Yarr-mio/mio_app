import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedText } from '@/components/themed/ThemedText';
import {
  getOnboardingCharacterById,
  ONBOARDING_DEFAULT_CHARACTER_ID,
} from '@/constants/characters';
import { MAIN_ROUTES } from '@/constants/routes';
import { AccountSection } from '@/features/mypage/components/AccountSection';
import { AiPartnerCard } from '@/features/mypage/components/AiPartnerCard';
import { LegalInfoSection } from '@/features/mypage/components/LegalInfoSection';
import { NotificationCard } from '@/features/mypage/components/NotificationCard';
import { SettingsGradientBackground } from '@/features/mypage/components/SettingsGradientBackground';
import { UserProfileCard } from '@/features/mypage/components/UserProfileCard';
import { useUserStore } from '@/store/userStore';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

const FALLBACK_NICKNAME = '사용자';
// TODO: userStore에 joinedAt 추가 필요
const FALLBACK_JOINED_AT = '2026-01-01';

export function SettingsScreen() {
  const router = useRouter();
  const { signupInfo, onboardingResult } = useUserStore();
  const [pushEnabled, setPushEnabled] = useState(true);

  const characterId = onboardingResult?.characterId ?? ONBOARDING_DEFAULT_CHARACTER_ID;
  const character = getOnboardingCharacterById(characterId);
  const nickname = signupInfo?.nickname ?? FALLBACK_NICKNAME;

  // TODO: userStore에 joinedAt 추가 필요
  const joinedAt = FALLBACK_JOINED_AT;
  const joinedAtLabel = `${format(new Date(joinedAt), 'yyyy-MM-dd')} 시작`;

  return (
    <View className="flex-1">
      <SettingsGradientBackground />

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
            characterLabel={`${character.name}와 함께`}
            joinedAtLabel={joinedAtLabel}
            onEditPress={() => router.push(MAIN_ROUTES.profileEdit)}
          />

          <View className="mt-6">
            <ThemedText type="smallTitle" className="mb-2 text-badge">
              내 AI 파트너
            </ThemedText>
            <AiPartnerCard
              characterName={character.name}
              characterIntro={character.chipLabel}
              characterImage={character.iconImage}
              onPress={() => router.push(MAIN_ROUTES.partner)}
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
