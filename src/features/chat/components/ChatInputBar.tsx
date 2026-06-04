import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FgColors } from '@/constants/theme';
import { cn } from '@/utils/cn';

interface ChatInputBarProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const canSend = text.trim().length > 0 && !disabled;

  function handleSend() {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <View className="flex-row items-end gap-3 px-4 py-3 border-t border-line bg-midnight">
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder="메시지를 입력해 주세요"
        placeholderTextColor={FgColors.muted}
        multiline
        className="flex-1 text-fg text-base leading-5 max-h-28 py-2"
        onSubmitEditing={handleSend}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        className={cn(
          'w-10 h-10 rounded-full items-center justify-center',
          canSend ? 'bg-primary' : 'bg-primary-inactive'
        )}
        accessibilityRole="button"
        accessibilityLabel="메시지 전송"
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 19V5M5 12l7-7 7 7"
            stroke={FgColors.default}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
    </View>
  );
}
