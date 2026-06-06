import { BackHeader } from '@/components/layout/BackHeader';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { DefaultBackground } from '@/components/ui/DefaultBackground';
import { Label } from '@/components/ui/Label';
import { PARTNER_LIST } from '@/constants/characters';
import {
  OnboardingStyleCardClasses,
  OnboardingStyleCardLayout,
  PressableConfig,
  ScreenSpacing,
} from '@/constants/theme';
import { usePartnerStore } from '@/features/mypage/store/partnerStore';
import { cn } from '@/utils/cn';
import { Image, type ImageSource } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PartnerOptionCardProps {
  name: string;
  tag: string;
  intro: string;
  image: ImageSource;
  selected: boolean;
  onPress: () => void;
}

function PartnerOptionCard({ name, tag, intro, image, selected, onPress }: PartnerOptionCardProps) {
  const { iconSlotSize, iconRenderScale } = OnboardingStyleCardLayout;
  const iconRenderSize = iconSlotSize * iconRenderScale;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={name}
      className={cn(
        'flex-row items-center gap-3 rounded-card border-2 py-6 pl-2 pr-4',
        selected
          ? 'border-sub-tab-selected-border bg-sub-tab-selected-bg'
          : 'border-sub-tab-inactive-border bg-sub-tab-inactive-bg'
      )}
      hitSlop={PressableConfig.hitSlop}
    >
      <View className={OnboardingStyleCardClasses.iconSlot}>
        <Image
          source={image}
          style={{ width: iconRenderSize, height: iconRenderSize }}
          contentFit="contain"
        />
      </View>
      <View className="flex-1 gap-2">
        <ThemedText type="smallTitle" className="text-fg-default">
          {name}
        </ThemedText>
        <Label label={tag} />
        <ThemedText type="default" className="text-sm leading-5 text-fg-default/80">
          {intro}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function PartnerSelectScreen() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const selectedPartner = usePartnerStore((state) => state.selectedPartner);
  const setSelectedPartner = usePartnerStore((state) => state.setSelectedPartner);
  const [tempSelected, setTempSelected] = useState(selectedPartner);

  const bottomPadding = Math.max(bottom, ScreenSpacing.bottomInsetMin);

  const handleApply = () => {
    setSelectedPartner(tempSelected);
    router.back();
  };

  return (
    <View className="flex-1">
      <DefaultBackground />
      <BackHeader title="파트너 변경" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-3 px-6 pt-2 pb-4"
        showsVerticalScrollIndicator={false}
      >
        {PARTNER_LIST.map((partner) => (
          <PartnerOptionCard
            key={partner.key}
            name={partner.name}
            tag={partner.tag}
            intro={partner.intro}
            image={partner.image}
            selected={tempSelected === partner.key}
            onPress={() => setTempSelected(partner.key)}
          />
        ))}
      </ScrollView>
      {/* safe area 대응 — 인라인 style 불가피 */}
      <View className="px-6 pt-2" style={{ paddingBottom: bottomPadding }}>
        <Button onPress={handleApply}>수정하기</Button>
      </View>
    </View>
  );
}
