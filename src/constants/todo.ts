import type { TodoCheckinRequest } from '@/types/todo';

export const TODO_SCREEN_TITLE = '감정 돌보기';

export const TODO_DATE_NAVIGATOR_A11Y_PREV = '이전 날짜';
export const TODO_DATE_NAVIGATOR_A11Y_NEXT = '다음 날짜';

export const TODO_ACTION_LABEL: Record<TodoCheckinRequest['status'], string> = {
  completed: '완료',
  partial_completed: '부분 완료',
  skipped: '못함',
};

export const TODO_EXPIRED_LABEL = '만료';

export const TODO_EMPTY_STATE_MESSAGE = '이 날은 등록된 할 일이 없어요';

export const TODO_ERROR_STATE_MESSAGE = '할 일을 불러오지 못했어요. 잠시 후 다시 시도해 주세요';
