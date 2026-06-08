import { AvatarCircleColors, AvatarCircleLayout, SettingsLayout } from '@/constants/theme';
import type { ImageSource } from 'expo-image';
import { Image } from 'expo-image';
import { cloneElement, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface ProfileAvatarCircleProps {
  imageSource?: ImageSource;
  size?: number;
  imageSize?: number;
  children?: ReactNode;
}

function renderIconChildren(children: ReactNode) {
  if (!isValidElement<SvgProps>(children)) {
    return children;
  }

  return cloneElement(children, { color: AvatarCircleColors.icon });
}

export function ProfileAvatarCircle({
  imageSource,
  size = SettingsLayout.avatarSize,
  imageSize = SettingsLayout.characterImageSize,
  children,
}: ProfileAvatarCircleProps) {
  const radius = size / 2;
  const { radiusInset, strokeWidth } = AvatarCircleLayout;

  return (
    // size prop 동적 적용 — 인라인 style 불가피
    <View style={{ width: size, height: size }}>
      {/* SVG 절대 위치 — 인라인 style 불가피 */}
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
          r={radius - radiusInset}
          fill="url(#avatarCircleGrad)"
          stroke={AvatarCircleColors.stroke}
          strokeWidth={strokeWidth}
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
          renderIconChildren(children)
        )}
      </View>
    </View>
  );
}
