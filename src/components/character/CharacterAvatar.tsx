import { Image } from 'expo-image';
import { getOnboardingCharacterById } from '@/constants/characters';
import type { OnboardingCharacterId } from '@/constants/characters';

const CHARACTER_AVATAR_SIZE = {
  sm: 32,
  md: 56,
  lg: 200,
} as const;

interface CharacterAvatarProps {
  characterId: OnboardingCharacterId;
  size: 'sm' | 'md' | 'lg';
  // TODO: variant="planet" 에셋 추가 전까지 default와 동일 이미지 사용
  variant?: 'default' | 'planet';
}

export function CharacterAvatar({ characterId, size }: CharacterAvatarProps) {
  const px = CHARACTER_AVATAR_SIZE[size];
  const source = getOnboardingCharacterById(characterId).image;

  return <Image source={source} style={{ width: px, height: px }} contentFit="contain" />;
}
