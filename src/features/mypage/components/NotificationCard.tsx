import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { NOTIFICATION_SETTINGS_LABELS } from '@/constants/notifications';
import { SwitchColors } from '@/constants/theme';
import { cn } from '@/utils/cn';
import { Switch, View } from 'react-native';

interface NotificationToggleRowProps {
  label: string;
  enabled: boolean;
  disabled?: boolean;
  textClassName?: string;
  className?: string;
  onToggle: (value: boolean) => void;
}

function NotificationToggleRow({
  label,
  enabled,
  disabled = false,
  textClassName = 'text-fg-default',
  className,
  onToggle,
}: NotificationToggleRowProps) {
  return (
    <View className={cn('flex-row items-center justify-between px-6 py-4', className)}>
      <ThemedText type="smallTitle" className={textClassName}>
        {label}
      </ThemedText>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: SwitchColors.trackFalse, true: SwitchColors.trackTrue }}
        thumbColor={SwitchColors.thumb}
        ios_backgroundColor={SwitchColors.iosBackgroundColor}
      />
    </View>
  );
}

interface NotificationCardProps {
  allEnabled: boolean;
  checkinEnabled: boolean;
  characterEnabled: boolean;
  reportEnabled: boolean;
  disabled?: boolean;
  onToggleAll: (value: boolean) => void;
  onToggleCheckin: (value: boolean) => void;
  onToggleCharacter: (value: boolean) => void;
  onToggleReport: (value: boolean) => void;
}

export function NotificationCard({
  allEnabled,
  checkinEnabled,
  characterEnabled,
  reportEnabled,
  disabled = false,
  onToggleAll,
  onToggleCheckin,
  onToggleCharacter,
  onToggleReport,
}: NotificationCardProps) {
  return (
    <View className="gap-2">
      <BaseCard>
        <NotificationToggleRow
          label={NOTIFICATION_SETTINGS_LABELS.all}
          enabled={allEnabled}
          disabled={disabled}
          className="py-6"
          onToggle={onToggleAll}
        />
      </BaseCard>

      <BaseCard className="overflow-hidden">
        <NotificationToggleRow
          label={NOTIFICATION_SETTINGS_LABELS.checkin}
          enabled={checkinEnabled}
          disabled={disabled}
          textClassName="text-fg-sub"
          className="py-4"
          onToggle={onToggleCheckin}
        />
        <NotificationToggleRow
          label={NOTIFICATION_SETTINGS_LABELS.character}
          enabled={characterEnabled}
          disabled={disabled}
          textClassName="text-fg-sub"
          className="border-t border-line py-4"
          onToggle={onToggleCharacter}
        />
        <NotificationToggleRow
          label={NOTIFICATION_SETTINGS_LABELS.report}
          enabled={reportEnabled}
          disabled={disabled}
          textClassName="text-fg-sub"
          className="border-t border-line py-4"
          onToggle={onToggleReport}
        />
      </BaseCard>
    </View>
  );
}
