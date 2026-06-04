import { ThemedText } from '@/components/themed/ThemedText';
import { View } from 'react-native';

export default function ProfileEditScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-midnight">
      <ThemedText type="subtitle" className="text-fg">
        수정 페이지
      </ThemedText>
    </View>
  );
}
