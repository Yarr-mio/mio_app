/**
 * 세션 요약 대기 화면 문구
 *
 * 문구는 서버가 알려준 진행 단계가 아니라 경과 시간에 따른 연출이다 — "몇 %" 처럼 사실로 읽히는
 * 표현을 쓰지 않고, 무엇을 하고 있는지만 캐릭터 말투로 전한다.
 * 캐릭터 이름이 들어가는 문구가 있어 전부 `(characterName) => string` 형태로 통일한다.
 */

export type SummaryLoadingMessage = (characterName: string) => string;

/**
 * 순서대로 노출되는 단계 문구.
 * 마지막 문구에서 멈춘다(훅이 보장) — 순환시키면 "거의 다 됐어요" 뒤에 처음 문구가 다시 나와
 * 진행이 역행하는 인상을 준다
 */
export const SUMMARY_LOADING_STAGE_MESSAGES: SummaryLoadingMessage[] = [
  () => '대화를 다시 읽고 있어요',
  () => '감정의 흐름을 정리하는 중이에요',
  () => '생각의 패턴을 살펴보고 있어요',
  (characterName) => `${characterName}가 거의 다 정리했어요`,
];

/** 예상보다 오래 걸릴 때 단계 문구를 대체하는 안심 문구 */
export const SUMMARY_LOADING_REASSURE_MESSAGE: SummaryLoadingMessage = (characterName) =>
  `조금만 더 걸리고 있어요.\n${characterName}가 꼼꼼히 정리하는 중이에요`;

/** 나가기 버튼과 함께 노출되는 안내 — 나가도 요약이 유실되지 않는다는 사실을 알린다 */
export const SUMMARY_LOADING_EXIT_NOTICE =
  '먼저 나가 계셔도 요약은 계속 만들어져요.\n채팅 탭에서 다시 볼 수 있어요';

export const SUMMARY_LOADING_EXIT_BUTTON_LABEL = '먼저 나가기';
