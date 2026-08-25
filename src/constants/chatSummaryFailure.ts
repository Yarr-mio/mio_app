/**
 * 세션 요약을 만들지 못했을 때의 문구
 *
 * 410(서버가 summary_status를 FAILED로 확정)은 재시도해도 결과가 바뀌지 않는다 — 사용자에게
 * "다시 해보라"고 하지 않고, 무엇이 없어졌는지와 다음 대화는 정상이라는 사실만 짧게 전한다.
 */

/** 요약이 영구적으로 없는 세션 — 재시도 불가 */
export const SUMMARY_UNAVAILABLE_MESSAGE =
  '이번 대화는 요약을 만들지 못했어요.\n다음 대화에서 다시 정리해 드릴게요';

export const SUMMARY_UNAVAILABLE_CONFIRM_LABEL = '확인';

/** 네트워크 오류 등 일시적 실패 — 재시도가 유효하다 */
export const SUMMARY_FETCH_FAILED_MESSAGE = '대화 요약을 불러오지 못했어요.\n다시 시도해 주세요.';

export const SUMMARY_FETCH_FAILED_RETRY_LABEL = '다시 시도';
