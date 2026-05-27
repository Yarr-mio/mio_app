/**
 * 서버 공통 응답 포맷 타입.
 *
 * 이 프로젝트에서 API 성공 응답은 아래 형태를 따른다고 가정한다.
 *
 * - data: 실제 payload
 * - meta: 요청 추적용 메타데이터
 *
 * 예)
 * {
 *   "data": { ... },
 *   "meta": { "trace_id": "01HV..." }
 * }
 *
 * mock 모드에서도 동일한 형태를 유지해야 UI/훅 레이어가 안정적으로 동작한다.
 */
export interface ApiMeta {
  trace_id: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}
