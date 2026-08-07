import type { PushPermissionTrigger } from '@/analytics/events';
import { track } from '@/analytics/track';
import { getNotificationPermissionGrantedAsync } from '@/notifications/fcm';

/**
 * 푸시 동의 결과 발행함
 * ensureReady 반환값과 별도로 권한 상태를 재조회해 granted bool을 얻음
 * getPermissionsAsync만 호출하는 읽기 전용 경로라 OS 프롬프트가 다시 뜨지 않음
 * ready와 token_unavailable은 granted true로 매핑함
 * permission_denied는 granted false로 매핑함
 * token_unavailable을 false로 접으면 동의율이 과소 산출되므로 재조회 방식을 씀
 * 사후 상태 관측이라 토큰 실패를 별도로 구분하지 않음
 * 계약상 granted bool만 필요하므로 손실 없음
 * throw하지 않으며 호출부를 기다리지 않음
 * 계측 실패 시에도 알림 설정 저장과 화면 전환 흐름은 유지함
 * 권한 조회 실패 시 이벤트를 발행하지 않음
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
