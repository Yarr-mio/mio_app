import { ThemedText } from '@/components/themed/ThemedText';

interface BiasTypesDisplayProps {
  biasTypesDetected: string | null;
}

// bias_types_detected는 구분자 포맷이 아직 불명확해 raw 문자열 그대로 표시한다.
// 포맷이 확인되면 이 컴포넌트만 칩(chip) 리스트 렌더링으로 교체하면 된다.
export function BiasTypesDisplay({ biasTypesDetected }: BiasTypesDisplayProps) {
  if (!biasTypesDetected) {
    return null;
  }

  return (
    <ThemedText type="default" className="text-fg-sub">
      {biasTypesDetected}
    </ThemedText>
  );
}
