import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { StepIndicator } from '@/components/ui/StepIndicator';

const SIGNUP_STEP_COUNT = 4;
const SIGNUP_CURRENT_STEP = 3;

export default function SignUpInfoScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground />
      <View
        className="flex-1 px-8"
        style={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <View className="pt-4">
          <StepIndicator totalSteps={SIGNUP_STEP_COUNT} currentStep={SIGNUP_CURRENT_STEP} />
        </View>

        <View className="flex-1 items-center justify-center">
          <ThemedText type="default" className="text-ink-night">
            회원가입 정보 입력 페이지!
          </ThemedText>
        </View>
      </View>
    </View>
  );
}
