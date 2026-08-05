/**
 * expo-router 라우트 세그먼트 → 적재용 화면명 정규화 (event-logging-spec v3.5 §8-A)
 *
 * 규칙 5개:
 * 1. 그룹 세그먼트(`(auth)`·`(main)` 등 괄호 세그먼트) 제거
 * 2. 말단 `index` 제거 — `home/index` → `home`
 * 3. 선행 `/` 제거 — 결과는 슬래시로 시작하지 않는다
 * 4. 나머지 `/`는 유지 — 계층이 곧 퍼널 단계 판정의 근거다
 * 5. 동적 세그먼트는 리터럴(`[id]`) 유지 — 실제 id로 치환하지 않는다(카디널리티 폭발·PII 유입 방지)
 *
 * ⚠️ `usePathname()`이 아니라 `useSegments()` 값을 넘길 것. pathname은 동적 세그먼트가
 * 이미 실제 값으로 치환돼 있어 규칙 5를 지킬 수 없다.
 */

/** 세그먼트가 하나도 남지 않는 루트 라우트의 화면명 */
const ROOT_SCREEN_NAME = 'index';

const GROUP_SEGMENT_PATTERN = /^\(.*\)$/;

const INDEX_SEGMENT = 'index';

function isGroupSegment(segment: string): boolean {
  return GROUP_SEGMENT_PATTERN.test(segment);
}

export function normalizeScreenName(segments: readonly string[]): string {
  const meaningful = segments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && !isGroupSegment(segment));

  if (meaningful.length > 1 && meaningful[meaningful.length - 1] === INDEX_SEGMENT) {
    meaningful.pop();
  }

  const screenName = meaningful.join('/');
  return screenName.length > 0 ? screenName : ROOT_SCREEN_NAME;
}
