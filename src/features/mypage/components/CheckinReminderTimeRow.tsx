import BottomArrowIcon from '@/assets/icons/bottom-arrow.svg';
import { ThemedText } from '@/components/themed/ThemedText';
import { SettingsLayout, SubtitleColors } from '@/constants/theme';
import { cn } from '@/utils/cn';
import { Pressable, View } from 'react-native';

interface CheckinReminderTimeRowProps {
  label: string;
  time: string;
  disabled?: boolean;
  className?: string;
  onPress: () => void;
}

export function CheckinReminderTimeRow({
  label,
  time,
  disabled = false,
  className,
  onPress,
}: CheckinReminderTimeRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${time}`}
      className={cn('flex-row items-center justify-between py-4 pl-10 pr-6', className)}
    >
      <ThemedText type="small" className="text-subtitle">
        {label}
      </ThemedText>
      <View className="flex-row items-center gap-1">
        <ThemedText type="small" className="text-subtitle">
          {time}
        </ThemedText>
        <BottomArrowIcon
          width={SettingsLayout.bottomArrowSize}
          height={SettingsLayout.bottomArrowSize}
          color={SubtitleColors.DEFAULT}
        />
      </View>
    </Pressable>
  );
}
