import { Image } from 'expo-image';
import { useWindowDimensions } from 'react-native';

const BACKGROUNDS = {
  auth: require('@/assets/images/background/auth_background.png'),
  login: require('@/assets/images/background/splash_background.png'),
} as const;

type AuthBackgroundVariant = keyof typeof BACKGROUNDS;

interface AuthBackgroundProps {
  variant?: AuthBackgroundVariant;
}

export function AuthBackground({ variant = 'auth' }: AuthBackgroundProps) {
  const { width, height } = useWindowDimensions();

  return (
    <Image
      source={BACKGROUNDS[variant]}
      contentFit="cover"
      style={{ position: 'absolute', top: 0, left: 0, width, height }}
    />
  );
}
