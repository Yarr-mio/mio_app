import { ThemedText } from '@/components/themed/ThemedText';

interface BiasTypesDisplayProps {
  biasTypesDetected: string[] | null;
}

// 칩(chip) 리스트 등 별도 디자인이 정해지기 전까지는 콤마로 이어 표시한다.
export function BiasTypesDisplay({ biasTypesDetected }: BiasTypesDisplayProps) {
  if (!biasTypesDetected || biasTypesDetected.length === 0) {
    return null;
  }

  return (
    <ThemedText type="default" className="text-fg-sub">
      {biasTypesDetected.join(', ')}
    </ThemedText>
  );
}
