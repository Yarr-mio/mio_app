import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="step1Emotion" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
