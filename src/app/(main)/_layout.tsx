import { Tabs, useSegments } from 'expo-router';

import AppTabs from '@/components/layout/AppTabs';

/** 탭 스택 상세 화면 — 전체 화면으로 표시하고 하단 탭 바 숨김 */
const TAB_BAR_HIDDEN_SEGMENTS = ['partner', 'edit-nickname', 'legal'] as const;

export default function MainLayout() {
  const segments = useSegments();
  const hideTabBar = segments.some((segment) =>
    (TAB_BAR_HIDDEN_SEGMENTS as readonly string[]).includes(segment)
  );

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={hideTabBar ? () => null : (props) => <AppTabs {...props} />}
    >
      <Tabs.Screen name="home" options={{ title: '홈' }} />
      <Tabs.Screen name="chat" options={{ title: '채팅' }} />
      <Tabs.Screen name="report" options={{ title: '별자리' }} />
      <Tabs.Screen name="explore" options={{ title: '더보기' }} />
    </Tabs>
  );
}
