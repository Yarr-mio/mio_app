import { Text, View } from 'react-native';

interface ChipProps {
  label: string;
}

export function Chip({ label }: ChipProps) {
  return (
    <View className="bg-white/15 rounded-full px-2.5 py-0.5">
      <Text className="text-white/80 text-xs">{label}</Text>
    </View>
  );
}
