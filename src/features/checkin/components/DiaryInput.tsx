import { InputColors } from '@/constants/theme';
import { Text, TextInput, View } from 'react-native';

interface DiaryInputProps {
  value: string;
  onChange?: (text: string) => void;
  maxLength?: number;
  editable?: boolean;
}

export function DiaryInput({ value, onChange, maxLength = 60, editable = true }: DiaryInputProps) {
  return (
    <View className="bg-surface rounded-2xl p-4 border border-line">
      <TextInput
        value={value}
        onChangeText={
          editable && onChange ? (text) => onChange(text.slice(0, maxLength)) : undefined
        }
        placeholder="지금 기분을 자유롭게 적어보세요..."
        placeholderTextColor={InputColors.placeholder}
        multiline
        numberOfLines={4}
        editable={editable}
        className="text-white text-sm min-h-[55px]"
        textAlignVertical="top"
      />
      <Text className="text-fg-faint text-xs text-right mt-2">
        {value.length}/{maxLength}
      </Text>
    </View>
  );
}
