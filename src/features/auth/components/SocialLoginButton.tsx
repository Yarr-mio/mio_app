import { Pressable, View } from 'react-native';

import { AppleIcon, KakaoIcon } from '@/assets/icons';
import { ThemedText } from '@/components/themed/ThemedText';
import { Colors } from '@/constants/theme';
import { cn } from '@/utils/cn';

export type SocialLoginProvider = 'kakao' | 'apple';

interface SocialLoginButtonProps {
  provider: SocialLoginProvider;
  onPress?: () => void;
  disabled?: boolean;
}

const SOCIAL_LOGIN_LABELS: Record<SocialLoginProvider, string> = {
  kakao: '카카오로 시작하기',
  apple: 'Apple로 계속하기',
};

const PROVIDER_STYLES: Record<SocialLoginProvider, { container: string; text: string }> = {
  kakao: {
    container: 'bg-kakao',
    text: 'text-kakao-text',
  },
  apple: {
    container: 'bg-apple',
    text: 'text-apple-text',
  },
};

const PROVIDER_ICONS: Record<
  SocialLoginProvider,
  { Icon: typeof AppleIcon; color: string; width: number; height: number }
> = {
  apple: { Icon: AppleIcon, color: Colors.light.text, width: 16, height: 20 },
  kakao: { Icon: KakaoIcon, color: Colors.light.text, width: 18, height: 18 },
};

export default function SocialLoginButton({
  provider,
  onPress,
  disabled = false,
}: SocialLoginButtonProps) {
  const { container, text } = PROVIDER_STYLES[provider];
  const { Icon, color, width, height } = PROVIDER_ICONS[provider];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={SOCIAL_LOGIN_LABELS[provider]}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'h-16 w-full flex-row items-center justify-center rounded-xl px-4',
        container,
        disabled && 'opacity-50'
      )}
    >
      {({ pressed }) => (
        <View
          className={cn(
            'flex-row items-center justify-center gap-[6px]',
            pressed && !disabled && 'opacity-80'
          )}
        >
          <Icon width={width} height={height} color={color} />
          <ThemedText type="default" className={cn('font-semibold', text)}>
            {SOCIAL_LOGIN_LABELS[provider]}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}
