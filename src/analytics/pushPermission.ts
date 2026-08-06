import type { PushPermissionTrigger } from '@/analytics/events';
import { track } from '@/analytics/track';
import { getNotificationPermissionGrantedAsync } from '@/notifications/fcm';

/**
 * 푸시 동의 결과 발행 (event-logging-spec v3.5 §4-B · 퍼널 5행 완료 판정)
 *
 * `useEnsurePushNotificationReady`의 `ensureReady`가 `Promise<void>`라 3값 결과
 * (`ready`/`permission_denied`/`token_unavailable`)를 내부에서 삼킨다. 훅의 반환 계약을 바꾸는 대신
 * **권한 상태를 다시 읽어** bool을 얻는다 — `getPermissionsAsync`만 호출하는 읽기 전용 함수라
 * OS 프롬프트가 다시 뜨지 않는다.
 *
 * 매핑이 정확히 일치한다:
 * - `ready` → 권한 있음 → `true`
 * - `token_unavailable`(권한은 받았고 토큰 등록만 실패) → 권한 있음 → `true`
 * - `permission_denied` → `false`
 *
 * ⚠️ `token_unavailable`을 `false`로 접으면 동의율이 과소 산출된다. 재조회 방식은 이걸 자동으로 맞춘다.
 * 수용하는 한계: "결과"가 아니라 "사후 상태"를 관측하므로 토큰 실패를 따로 구분하지 못한다.
 * 현 계약은 `granted` bool만 요구하므로 손실이 없다.
 *
 * ⚠️ 절대 throw하지 않고 호출부를 기다리게 하지도 않는다 — 계측이 실패해도 알림 설정 저장·화면
 * 전환 같은 기존 흐름이 그대로 이어져야 한다(계측을 no-op으로 만들어도 앱 동작이 같아야 한다).
 * 권한 조회가 실패하면 발행하지 않는다. 임의의 bool로 채우면 동의율이 조용히 틀린다.
 */
export function trackPushPermissionResultFromCurrentStatus(trigger: PushPermissionTrigger): void {
  void (async () => {
    try {
      const granted = await getNotificationPermissionGrantedAsync();
      track('push_permission_result', { granted, trigger });
    } catch (error) {
      console.warn('[analytics] failed to read push permission status', error);
    }
  })();
}
