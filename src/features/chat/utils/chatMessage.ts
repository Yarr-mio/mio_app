import type { ChatMessage, SessionInitialMessage } from '@/types/chat';

/**
 * 서버 메시지 DTO를 앱 도메인 타입 `ChatMessage`로 옮기는 순수 변환 모음.
 *
 * `kind`/`role` 값을 런타임 검증하지 않는다 — 서버가 모양을 보장한다는 기존 방침을 따른다
 * (`useChatSse.ts`의 SSE 이벤트 처리와 동일).
 */

/**
 * `POST /v1/sessions`의 선제 인사를 첫 AI 말풍선으로 변환한다.
 * 부재(`undefined`: BE #428 미배포 / `null`: 오프닝 없음)를 여기서 흡수해 호출부 분기를 없앤다.
 */
export function toOpeningChatMessage(
  initialMessage: SessionInitialMessage | null | undefined
): ChatMessage | null {
  if (!initialMessage) return null;

  return {
    // 서버 message_id를 그대로 쓴다 — 이력 복원과의 중복 제거 키(명세 FE 연동 계약)
    id: initialMessage.message_id,
    // 서버 DTO는 'assistant', 앱 도메인은 'ai'
    role: 'ai',
    type: 'normal',
    content: initialMessage.content,
    timestamp: initialMessage.created_at,
  };
}
