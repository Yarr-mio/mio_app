import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 종료 지점 화면 — 뒤로 스와이프로 sessionId가 사라진 빈 화면에 도달하는 것을 막는다 */}
      <Stack.Screen name="summary" options={{ gestureEnabled: false }} />
      <Stack.Screen name="end" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
