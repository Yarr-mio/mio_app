import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { SwitchColors } from '@/constants/theme';
import { Switch } from 'react-native';

interface NotificationCardProps {
  enabled: boolean;
  disabled?: boolean;
  onToggle: (value: boolean) => void;
}

export function NotificationCard({ enabled, disabled = false, onToggle }: NotificationCardProps) {
  return (
    <BaseCard className="flex-row items-center justify-between px-6 py-6">
      <ThemedText type="smallTitle" className="text-fg-default">
        푸시 알림
      </ThemedText>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: SwitchColors.trackFalse, true: SwitchColors.trackTrue }}
        thumbColor={SwitchColors.thumb}
        ios_backgroundColor={SwitchColors.iosBackgroundColor}
      />
    </BaseCard>
  );
}
