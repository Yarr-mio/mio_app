import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="step4Character" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
