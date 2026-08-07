import AsyncStorage from '@react-native-async-storage/async-storage';

import { ANALYTICS_STORAGE_KEYS } from '@/analytics/constants';
import { getKstDayDifference } from '@/utils/date';

/**
 * `app_session_started`의 판정값 — 최초 실행 여부와 직전 세션과의 간격
 *
 * ⚠️ `is_first_session`이 빠지면 신규/복귀 구분이 통째로 무너진다.
 * 최초 실행 플래그는 비밀값이 아니므로 SecureStore가 아니라 AsyncStorage에 둔다.
 */
export interface AppSessionMeta {
  /** 이 기기에서 앱을 처음 실행한 세션인지 */
  isFirstSession: boolean;
  /** 직전 세션과의 KST 기준 일수. 직전 세션이 없으면 null */
  daysSinceLastSession: number | null;
}

function parseTimestamp(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

/**
 * 세션 시작 시 1회 호출. 판정값을 돌려주고 다음 세션을 위해 시작 시각을 기록한다.
 * 저장소 접근이 실패해도 계측이 멈추면 안 되므로 보수적인 기본값(첫 세션 아님)으로 흘려보낸다.
 */
export async function resolveAppSessionMeta(): Promise<AppSessionMeta> {
  const startedAt = Date.now();

  try {
    const [firstLaunchAt, lastSessionStartedAt] = await Promise.all([
      AsyncStorage.getItem(ANALYTICS_STORAGE_KEYS.firstLaunchAt),
      AsyncStorage.getItem(ANALYTICS_STORAGE_KEYS.lastSessionStartedAt),
    ]);

    const previousSessionAt = parseTimestamp(lastSessionStartedAt);
    const isFirstSession = parseTimestamp(firstLaunchAt) === null;

    const writes: Promise<void>[] = [
      AsyncStorage.setItem(ANALYTICS_STORAGE_KEYS.lastSessionStartedAt, String(startedAt)),
    ];
    if (isFirstSession) {
      writes.push(AsyncStorage.setItem(ANALYTICS_STORAGE_KEYS.firstLaunchAt, String(startedAt)));
    }
    await Promise.all(writes);

    return {
      isFirstSession,
      daysSinceLastSession:
        previousSessionAt === null
          ? null
          : getKstDayDifference(new Date(previousSessionAt), new Date(startedAt)),
    };
  } catch (error) {
    console.warn('[analytics] failed to resolve app session meta', error);
    return { isFirstSession: false, daysSinceLastSession: null };
  }
}
