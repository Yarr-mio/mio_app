import { AvatarCircleColors, SettingsLayout } from '@/constants/theme';
import type { ImageSource } from 'expo-image';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface ProfileAvatarCircleProps {
  imageSource?: ImageSource;
  imageSize?: number;
  children?: ReactNode;
}

export function ProfileAvatarCircle({
  imageSource,
  imageSize = SettingsLayout.characterImageSize,
  children,
}: ProfileAvatarCircleProps) {
  const size = SettingsLayout.avatarSize;
  const radius = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="avatarCircleGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={AvatarCircleColors.gradientStart} />
            <Stop offset="1" stopColor={AvatarCircleColors.gradientEnd} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={radius}
          cy={radius}
          r={radius - 1}
          fill="url(#avatarCircleGrad)"
          stroke={AvatarCircleColors.stroke}
          strokeWidth={1}
        />
      </Svg>
      <View className="flex-1 items-center justify-center">
        {imageSource ? (
          <Image
            source={imageSource}
            style={{ width: imageSize, height: imageSize }}
            contentFit="contain"
          />
        ) : (
          children
        )}
      </View>
    </View>
  );
}
