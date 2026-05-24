import { Text, View } from 'react-native';

interface ChipProps {
  label: string;
}

export function Chip({ label }: ChipProps) {
  return (
    <View className="bg-surface-lg rounded-full px-2.5 py-0.5">
      <Text className="text-fg-sub text-xs">{label}</Text>
    </View>
  );
}
