import { Image } from 'expo-image';
import { useWindowDimensions } from 'react-native';

const CHAT_BACKGROUND = require('@/assets/images/background/chat_background.png');

export function ChatBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <Image
      source={CHAT_BACKGROUND}
      contentFit="cover"
      style={{ position: 'absolute', top: 0, left: 0, width, height }}
    />
  );
}
