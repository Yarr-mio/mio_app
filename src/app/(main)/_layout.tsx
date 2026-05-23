import { Tabs } from 'expo-router';

export default function MainLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: '홈' }} />
      <Tabs.Screen name="chat" options={{ title: '채팅' }} />
      <Tabs.Screen name="report" options={{ title: '별자리' }} />
      <Tabs.Screen name="my" options={{ title: '마이' }} />
      <Tabs.Screen name="explore" options={{ title: '더보기' }} />
    </Tabs>
  );
}
