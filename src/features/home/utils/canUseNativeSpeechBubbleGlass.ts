import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform } from 'react-native';

/**
 * iOS 26+ Liquid Glass API 사용 가능 여부.
 * Android / Web / iOS 25 이하는 항상 false (expo-glass-effect 스텁).
 */
export function canUseNativeSpeechBubbleGlass(): boolean {
  if (Platform.OS !== 'ios') {
    return false;
  }

  return isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
}
