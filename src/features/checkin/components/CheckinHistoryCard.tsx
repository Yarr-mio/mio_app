import { CheckinSummaryRow } from '@/components/checkin/CheckinSummaryRow';
import { HomeCardShell } from '@/components/ui/HomeCardShell';
import { TIME_OF_DAY_META } from '@/constants/checkin';
import { EMOTION_META } from '@/constants/emotions';
import type { CheckinRecord } from '@/types/checkin';
import { formatCheckinFullDate, formatCheckinTime } from '@/utils/date';
import { Pressable } from 'react-native';

interface CheckinHistoryCardProps {
  record: CheckinRecord;
  onPress: () => void;
}

export function CheckinHistoryCard({ record, onPress }: CheckinHistoryCardProps) {
  const meta = EMOTION_META[record.emotion_type];
  const timeOfDayMeta = TIME_OF_DAY_META[record.time_of_day];
  const title = `${formatCheckinFullDate(record.created_at)} · ${timeOfDayMeta.emoji} ${timeOfDayMeta.label}`;

  return (
    <Pressable onPress={onPress}>
      <HomeCardShell
        title={title}
        titleTextType="small"
        titleClassName="text-fg font-medium"
        headerActionLabel="자세히"
        onHeaderActionPress={undefined}
        headerContainerClassName="mb-3"
      >
        <CheckinSummaryRow
          emotionIcon={meta.image}
          emotionName={meta.label}
          intensity={record.condition_score}
          memo={record.memo}
          time={formatCheckinTime(record.created_at)}
        />
      </HomeCardShell>
    </Pressable>
  );
}
