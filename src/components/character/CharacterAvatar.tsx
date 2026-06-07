import type { OnboardingCharacterId } from '@/constants/characters';
import { getOnboardingCharacterById } from '@/constants/characters';
import { Image } from 'expo-image';
import { View } from 'react-native';

const CHARACTER_AVATAR_SIZE = {
  sm: 32,
  md: 56,
  lg: 200,
} as const;

// 배경 원의 지름 = 캐릭터 크기의 1.6배 (캐릭터가 원 안에 여백을 두고 들어차도록)
const CHARACTER_AVATAR_BACKGROUND_SCALE = 1.6;

interface CharacterAvatarProps {
  characterId: OnboardingCharacterId;
  size: 'sm' | 'md' | 'lg';
  // TODO: variant="planet" 에셋 추가 전까지 default와 동일 이미지 사용
  variant?: 'default' | 'planet';
  // 캐릭터 뒤에 원형 배경(primary 60% 투명도)을 표시할지 여부. 기본값은 미표시.
  background?: boolean;
}

export function CharacterAvatar({ characterId, size, background = false }: CharacterAvatarProps) {
  const px = CHARACTER_AVATAR_SIZE[size];
  const source = getOnboardingCharacterById(characterId).image;
  const characterImage = (
    <Image source={source} style={{ width: px, height: px }} contentFit="contain" />
  );

  if (!background) {
    return characterImage;
  }

  const backgroundPx = px * CHARACTER_AVATAR_BACKGROUND_SCALE;

  return (
    <View
      className="items-center justify-center rounded-full bg-primary/60"
      style={{ width: backgroundPx, height: backgroundPx }}
    >
      {characterImage}
    </View>
  );
}
