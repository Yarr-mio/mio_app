import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/utils/cn';

export default function SignUpInfoScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn(
        'flex-1 items-center justify-center bg-midnight',
        `pt-[${insets.top}px]`,
        `pb-[${insets.bottom}px]`
      )}
    >
      <Text className="text-lg text-ink-night">회원가입 정보 입력 페이지!</Text>
    </View>
  );
}
