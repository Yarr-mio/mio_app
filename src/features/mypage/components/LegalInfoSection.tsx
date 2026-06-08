import ChevronRightIcon from '@/assets/icons/chevron-right.svg';
import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { MAIN_ROUTES } from '@/constants/routes';
import { SettingsLayout, SubtitleColors } from '@/constants/theme';
import { LEGAL_INFO_ITEMS, type LegalInfoItemId } from '@/features/mypage/constants/legalInfo';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

const LEGAL_INFO_ROUTES: Record<LegalInfoItemId, (typeof MAIN_ROUTES)[keyof typeof MAIN_ROUTES]> = {
  terms: MAIN_ROUTES.legalTerms,
  privacy: MAIN_ROUTES.legalPrivacy,
  sensitive: MAIN_ROUTES.legalSensitive,
};

interface LegalInfoRowProps {
  label: string;
  onPress: () => void;
}

function LegalInfoRow({ label, onPress }: LegalInfoRowProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <BaseCard className="flex-row items-center justify-between px-6 py-6">
        <ThemedText type="smallTitle" className="text-fg-default">
          {label}
        </ThemedText>
        <ChevronRightIcon
          width={SettingsLayout.chevronWidth}
          height={SettingsLayout.chevronHeight}
          color={SubtitleColors.DEFAULT}
        />
      </BaseCard>
    </Pressable>
  );
}

export function LegalInfoSection() {
  const router = useRouter();

  return (
    <View className="gap-2">
      {LEGAL_INFO_ITEMS.map((item) => (
        <LegalInfoRow
          key={item.id}
          label={item.label}
          onPress={() => router.push(LEGAL_INFO_ROUTES[item.id])}
        />
      ))}
    </View>
  );
}
