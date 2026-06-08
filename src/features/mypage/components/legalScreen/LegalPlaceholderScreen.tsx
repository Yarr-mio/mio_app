import { BackHeader } from '@/components/layout/BackHeader';
import { ThemedText } from '@/components/themed/ThemedText';
import { DefaultBackground } from '@/components/ui/DefaultBackground';
import { View } from 'react-native';

interface LegalPlaceholderScreenProps {
  title: string;
}

export function LegalPlaceholderScreen({ title }: LegalPlaceholderScreenProps) {
  return (
    <View className="flex-1">
      <DefaultBackground />
      <BackHeader title={title} />
      <View className="flex-1 items-center justify-center px-6">
        <ThemedText type="default" className="text-center text-fg">
          {title}
        </ThemedText>
      </View>
    </View>
  );
}
