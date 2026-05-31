import { ThemedText } from '@/components/themed/ThemedText';
import { HomeBubbleBlurConfig, HomeBubbleClasses, HomeBubbleLayout } from '@/constants/theme';
import { canUseNativeSpeechBubbleGlass } from '@/features/home/utils/canUseNativeSpeechBubbleGlass';
import { cn } from '@/utils/cn';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import type { PropsWithChildren } from 'react';
import { Platform, View } from 'react-native';

interface CharacterSpeechBubbleProps {
  message: string;
}

function SpeechBubbleText({ message }: CharacterSpeechBubbleProps) {
  return (
    <ThemedText type="small" className="text-fg-default">
      {message}
    </ThemedText>
  );
}

/**
 * iOS·Android·Web fallback — expo-blur BlurView + 디자인 토큰 틴트/테두리
 * (expo-blur ~14.1.5: Android는 experimentalBlurMethod 필요)
 */
function BlurSpeechBubbleSurface({ children }: PropsWithChildren) {
  const isAndroid = Platform.OS === 'android';

  return (
    <View className={cn(HomeBubbleClasses.shell, 'relative')}>
      <BlurView
        intensity={HomeBubbleBlurConfig.intensity}
        tint={HomeBubbleBlurConfig.tint}
        style={HomeBubbleLayout.glassAbsoluteFill}
        experimentalBlurMethod={
          isAndroid ? HomeBubbleBlurConfig.androidExperimentalBlurMethod : undefined
        }
        blurReductionFactor={
          isAndroid ? HomeBubbleBlurConfig.androidBlurReductionFactor : undefined
        }
      />
      <View pointerEvents="none" className={HomeBubbleClasses.blurTintOverlay} />
      <View pointerEvents="none" className={HomeBubbleClasses.frostHighlight} />
      <View className={cn(HomeBubbleClasses.padding, 'relative z-10')}>{children}</View>
    </View>
  );
}

function NativeGlassSpeechBubble({ message }: CharacterSpeechBubbleProps) {
  return (
    <View className={cn(HomeBubbleClasses.shell, 'relative')}>
      <GlassView
        style={HomeBubbleLayout.glassAbsoluteFill}
        glassEffectStyle="regular"
        colorScheme="dark"
      />
      <View className={cn(HomeBubbleClasses.padding, 'relative z-10')}>
        <SpeechBubbleText message={message} />
      </View>
    </View>
  );
}

export function CharacterSpeechBubble({ message }: CharacterSpeechBubbleProps) {
  if (canUseNativeSpeechBubbleGlass()) {
    return <NativeGlassSpeechBubble message={message} />;
  }

  return (
    <BlurSpeechBubbleSurface>
      <SpeechBubbleText message={message} />
    </BlurSpeechBubbleSurface>
  );
}
