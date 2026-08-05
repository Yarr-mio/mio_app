import { useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { resolveAppSessionMeta } from '@/analytics/appSessionMeta';
import { APP_SESSION_TIMEOUT_MS } from '@/analytics/constants';
import type { EntryPoint } from '@/analytics/events';
import {
  consumePushEntry,
  resolveColdStartPushEntry,
  startNotificationEntryTracking,
} from '@/analytics/notificationEntry';
import {
  beginAppSession,
  getAppSessionSnapshot,
  getOrCreateAppSessionId,
  recordScreenView,
} from '@/analytics/session';
import { flushAnalytics, startAnalytics, track } from '@/analytics/track';
import { normalizeScreenName } from '@/utils/screenName';

/**
 * 앱 세션 생명주기 계측 (event-logging-spec v3.5 §4-A)
 *
 * - cold start / 백그라운드 30분+ 복귀 → 새 `app_session_id` + `app_session_started`
 * - 백그라운드 전환 → `app_session_ended` + 큐 강제 flush
 * - 라우트 진입 → `screen_viewed` (정규화된 화면명)
 *
 * ⚠️ 앱 전역 `AppState` 리스너는 여기 하나뿐이어야 한다. `useChat.ts`·`useSyncAuthProfileOnForeground.ts`의
 * 기존 리스너는 활성 세션 재조회·프로필 동기화라는 다른 목적이라 건드리지 않는다.
 * ⚠️ `screen_viewed`는 로그인 전에도 발행된다 — 가입 첫 화면 도달이 퍼널의 분모다.
 */
async function emitAppSessionStarted(entryPoint: EntryPoint): Promise<void> {
  const meta = await resolveAppSessionMeta();

  if (meta.isFirstSession) {
    track('app_installed', {});
  }

  track('app_session_started', {
    entry_point: entryPoint,
    is_first_session: meta.isFirstSession,
    days_since_last_session: meta.daysSinceLastSession,
  });
}

export function AnalyticsSessionProvider() {
  const segments = useSegments();
  /** 백그라운드로 내려간 시각 — 30분 규칙 판정용 */
  const backgroundedAtRef = useRef<number | null>(null);

  // 알림 탭 구독을 세션 시작보다 먼저 건다 (effect는 선언 순서대로 실행된다)
  useEffect(() => startNotificationEntryTracking(), []);

  // 디스크에 남아 있던 이벤트 복원 + 주기 전송 시작
  useEffect(() => startAnalytics(), []);

  useEffect(() => {
    // id는 동기로 먼저 발급한다 — 진입점 판정(비동기) 중에 발행되는 이벤트도 app_session_id가 있어야 한다
    getOrCreateAppSessionId();

    void (async () => {
      const openedFromPush = await resolveColdStartPushEntry();
      await emitAppSessionStarted(openedFromPush ? 'push_notification' : 'cold_start');
    })();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // iOS의 'inactive'(제어센터 등 일시 상태)는 세션 경계로 보지 않는다
      if (nextAppState === 'background') {
        const snapshot = getAppSessionSnapshot();
        if (snapshot) {
          track('app_session_ended', {
            last_screen: snapshot.lastScreen,
            duration_ms: snapshot.durationMs,
            screen_count: snapshot.screenCount,
          });
        }

        backgroundedAtRef.current = Date.now();
        flushAnalytics();
        return;
      }

      if (nextAppState !== 'active') {
        return;
      }

      const backgroundedAt = backgroundedAtRef.current;
      backgroundedAtRef.current = null;
      if (backgroundedAt === null || Date.now() - backgroundedAt < APP_SESSION_TIMEOUT_MS) {
        return;
      }

      beginAppSession();
      void emitAppSessionStarted(consumePushEntry() ? 'push_notification' : 'background_resume');
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const screenName = normalizeScreenName(segments);
    const view = recordScreenView(screenName);
    if (!view) {
      return;
    }

    track('screen_viewed', { screen_name: screenName, referrer_screen: view.referrerScreen });
  }, [segments]);

  return null;
}
