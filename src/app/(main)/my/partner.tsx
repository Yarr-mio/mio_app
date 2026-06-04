import { BackHeader } from '@/components/layout/BackHeader';
import { ThemedText } from '@/components/themed/ThemedText';
import { View } from 'react-native';

export default function PartnerScreen() {
  return (
    <View className="flex-1 bg-midnight">
      <BackHeader title="AI 파트너" />
      <View className="flex-1 items-center justify-center">
        <ThemedText type="subtitle" className="text-fg">
          AI 파트너 페이지
        </ThemedText>
      </View>
    </View>
  );
}
