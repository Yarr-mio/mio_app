import { Label } from '@/components/ui/Label';
import { DISTORTION_TYPE_LABELS } from '@/constants/report';
import type { DistortionType } from '@/types/report';
import { View } from 'react-native';

interface BiasTypesDisplayProps {
  biasTypesDetected: DistortionType[] | null;
}

export function BiasTypesDisplay({ biasTypesDetected }: BiasTypesDisplayProps) {
  if (!biasTypesDetected || biasTypesDetected.length === 0) {
    return null;
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {biasTypesDetected.map((type) => (
        <Label key={type} label={DISTORTION_TYPE_LABELS[type]} />
      ))}
    </View>
  );
}
