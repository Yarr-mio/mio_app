import { CheckinSummaryRow } from '@/components/checkin/CheckinSummaryRow';
import { HomeCardShell } from '@/components/ui/HomeCardShell';
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

  return (
    <Pressable onPress={onPress}>
      <HomeCardShell
        title={formatCheckinFullDate(record.created_at)}
        titleTextType="small"
        titleClassName="text-badge font-medium"
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
