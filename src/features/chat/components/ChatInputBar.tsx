import { ArrowUpIcon } from '@/assets/icons';
import { FgColors } from '@/constants/theme';
import { cn } from '@/utils/cn';
import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

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
    <View className="flex-row items-center gap-3 px-4 pt-3 pb-6 bg-midnight">
      <View
        className="flex-1 flex-row items-center bg-surface-md rounded-3xl px-4 border-line"
        style={{ borderWidth: 1.5 }}
      >
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="메시지를 입력해 주세요"
          placeholderTextColor={FgColors.muted}
          multiline
          textAlignVertical="center"
          className="flex-1 text-fg-default text-base leading-5 max-h-28 py-3"
          onSubmitEditing={handleSend}
        />
      </View>
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        className={cn(
          'w-11 h-11 rounded-full items-center justify-center',
          canSend ? 'bg-primary' : 'bg-primary-inactive'
        )}
        accessibilityRole="button"
        accessibilityLabel="메시지 전송"
      >
        <ArrowUpIcon width={20} height={20} color={FgColors.default} />
      </Pressable>
    </View>
  );
}
