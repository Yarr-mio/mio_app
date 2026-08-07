import { Stack } from 'expo-router';

export default function SignUpLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="character" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
