import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed/ThemedText';
import { NicknameDuplicateCheckClasses } from '@/constants/theme';
import { cn } from '@/utils/cn';

export type NicknameDuplicateCheckStatus = 'idle' | 'available' | 'unavailable';

interface NicknameDuplicateCheckButtonProps {
  status: NicknameDuplicateCheckStatus;
  disabled?: boolean;
  onPress: () => void;
}

const STATUS_LABEL: Record<NicknameDuplicateCheckStatus, string> = {
  idle: '중복 확인',
  available: '사용 가능',
  unavailable: '사용 불가',
};

const STATUS_CONTAINER_CLASS: Record<NicknameDuplicateCheckStatus, string> = {
  idle: NicknameDuplicateCheckClasses.default,
  available: NicknameDuplicateCheckClasses.available,
  unavailable: NicknameDuplicateCheckClasses.unavailable,
};

const STATUS_TEXT_CLASS: Record<NicknameDuplicateCheckStatus, string> = {
  idle: NicknameDuplicateCheckClasses.defaultText,
  available: NicknameDuplicateCheckClasses.availableText,
  unavailable: NicknameDuplicateCheckClasses.unavailableText,
};

export function NicknameDuplicateCheckButton({
  status,
  disabled = false,
  onPress,
}: NicknameDuplicateCheckButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={STATUS_LABEL[status]}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cn(STATUS_CONTAINER_CLASS[status], disabled && 'opacity-50')}
    >
      <ThemedText type="small" className={STATUS_TEXT_CLASS[status]}>
        {STATUS_LABEL[status]}
      </ThemedText>
    </Pressable>
  );
}
