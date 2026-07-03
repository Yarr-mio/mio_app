import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import {
  CHECKIN_REMINDER_LABELS,
  CHECKIN_TIME_SLOTS,
  NOTIFICATION_SETTINGS_LABELS,
} from '@/constants/notifications';
import { SwitchColors } from '@/constants/theme';
import { CheckinReminderTimeRow } from '@/features/mypage/components/CheckinReminderTimeRow';
import { TimePickerModal } from '@/features/mypage/components/TimePickerModal';
import type { CheckinTime } from '@/types/user';
import { cn } from '@/utils/cn';
import { useState } from 'react';
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
  checkinTime?: CheckinTime;
  characterEnabled: boolean;
  reportEnabled: boolean;
  disabled?: boolean;
  onToggleAll: (value: boolean) => void;
  onToggleCheckin: (value: boolean) => void;
  onCheckinTimeChange: (slot: keyof CheckinTime, time: string) => void;
  onToggleCharacter: (value: boolean) => void;
  onToggleReport: (value: boolean) => void;
}

export function NotificationCard({
  allEnabled,
  checkinEnabled,
  checkinTime,
  characterEnabled,
  reportEnabled,
  disabled = false,
  onToggleAll,
  onToggleCheckin,
  onCheckinTimeChange,
  onToggleCharacter,
  onToggleReport,
}: NotificationCardProps) {
  const [editingSlot, setEditingSlot] = useState<keyof CheckinTime | null>(null);

  const editingTime = editingSlot && checkinTime ? checkinTime[editingSlot] : '09:00';

  const handleTimeConfirm = (time: string) => {
    if (!editingSlot) {
      return;
    }

    onCheckinTimeChange(editingSlot, time);
    setEditingSlot(null);
  };

  const handleTimePickerClose = () => {
    setEditingSlot(null);
  };

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

        {checkinEnabled && checkinTime
          ? CHECKIN_TIME_SLOTS.map((slot) => (
              <CheckinReminderTimeRow
                key={slot}
                label={CHECKIN_REMINDER_LABELS[slot]}
                time={checkinTime[slot]}
                disabled={disabled}
                className="border-t border-line"
                onPress={() => setEditingSlot(slot)}
              />
            ))
          : null}

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

      <TimePickerModal
        visible={editingSlot !== null}
        value={editingTime}
        onClose={handleTimePickerClose}
        onConfirm={handleTimeConfirm}
      />
    </View>
  );
}
