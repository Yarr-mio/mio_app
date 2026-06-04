import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedText } from '@/components/themed/ThemedText';
import { View } from 'react-native';

export function TodoScreen() {
  return (
    <View className="flex-1 bg-midnight">
      <ScreenContainer className="flex-1 bg-transparent">
        <View className="flex-1 items-center justify-center">
          <ThemedText type="defaultBold" className="text-fg-default">
            투두 화면
          </ThemedText>
        </View>
      </ScreenContainer>
    </View>
  );
}
