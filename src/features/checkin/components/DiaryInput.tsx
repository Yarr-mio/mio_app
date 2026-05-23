import { Text, TextInput, View } from 'react-native';

interface DiaryInputProps {
  value: string;
  onChange: (text: string) => void;
  maxLength?: number;
}

export function DiaryInput({ value, onChange, maxLength = 200 }: DiaryInputProps) {
  return (
    <View className="bg-white/5 rounded-2xl p-4 border border-white/10">
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.slice(0, maxLength))}
        placeholder="지금 기분을 자유롭게 적어보세요..."
        placeholderTextColor="rgba(255,255,255,0.3)"
        multiline
        numberOfLines={4}
        className="text-white text-sm min-h-[80px]"
        textAlignVertical="top"
      />
      <Text className="text-white/40 text-xs text-right mt-2">
        {value.length}/{maxLength}
      </Text>
    </View>
  );
}
