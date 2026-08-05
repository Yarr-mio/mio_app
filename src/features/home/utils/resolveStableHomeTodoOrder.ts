import type { TodoResponse } from '@/types/todo';

function buildTodoIdSetKey(todoIds: string[]): string {
  return [...todoIds].sort().join('|');
}

/**
 * 홈 추천 행동 목록 순서 고정
 * todo_id 집합이 바뀔 때만 API 순서로 갱신
 */
export function resolveStableHomeTodoOrder(
  actions: TodoResponse[],
  previousOrderIds: string[],
  previousIdSetKey: string
): { orderedActions: TodoResponse[]; orderIds: string[]; idSetKey: string } {
  const currentIds = actions.map((action) => action.todo_id);
  const idSetKey = buildTodoIdSetKey(currentIds);
  const orderIds = idSetKey === previousIdSetKey ? previousOrderIds : currentIds;
  const byId = new Map(actions.map((action) => [action.todo_id, action]));

  const orderedActions = orderIds.flatMap((todoId) => {
    const todo = byId.get(todoId);
    return todo ? [todo] : [];
  });

  return { orderedActions, orderIds, idSetKey };
}
