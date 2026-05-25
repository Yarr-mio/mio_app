import { Pressable, Text, View } from 'react-native';

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

export default function SocialLoginButton({
  provider,
  onPress,
  disabled = false,
}: SocialLoginButtonProps) {
  const { container, text } = PROVIDER_STYLES[provider];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={SOCIAL_LOGIN_LABELS[provider]}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'h-16 w-full flex-row items-center justify-center gap-6 rounded-xl px-4',
        container,
        disabled && 'opacity-50'
      )}
    >
      {({ pressed }) => (
        <View
          className={cn(
            'w-full flex-row items-center justify-center gap-2',
            pressed && !disabled && 'opacity-80'
          )}
        >
          <Text className={cn('text-base font-semibold', text)}>
            {SOCIAL_LOGIN_LABELS[provider]}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
