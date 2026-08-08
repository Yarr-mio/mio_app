import { HOME_RECOMMENDED_TODO_MAX_COUNT } from '@/constants/home';
import type { TodoResponse, TodoStatus } from '@/types/todo';

export function isHomeTodoDone(status: TodoStatus): boolean {
  return status === 'completed' || status === 'partial_completed';
}

export function buildHomeTodoDoneIdSet(
  allTodos: TodoResponse[],
  optimisticDoneIds: ReadonlySet<string> = new Set()
): Set<string> {
  const doneIds = new Set<string>();

  for (const todo of allTodos) {
    if (isHomeTodoDone(todo.status) || optimisticDoneIds.has(todo.todo_id)) {
      doneIds.add(todo.todo_id);
    }
  }

  return doneIds;
}

function buildTodoIndexMap(allTodos: TodoResponse[]): Map<string, number> {
  return new Map(allTodos.map((todo, index) => [todo.todo_id, index]));
}

function findNextUnshownIncompleteTodoId(
  allTodos: TodoResponse[],
  doneIds: ReadonlySet<string>,
  displayedIds: ReadonlySet<string>
): string | undefined {
  for (const todo of allTodos) {
    if (!doneIds.has(todo.todo_id) && !displayedIds.has(todo.todo_id)) {
      return todo.todo_id;
    }
  }

  return undefined;
}

interface FillHomeRecommendedTodoDisplayIdsParams {
  allTodos: TodoResponse[];
  doneIds: ReadonlySet<string>;
  maxCount: number;
  incompleteCandidateIds: string[];
  completedCandidateIds: string[];
}

/**
 * 미완료 항목으로 최대한 채우고 부족분은 완료 항목(index 오름차순)으로 maxCount까지 채움
 * 전체 투두 개수가 maxCount보다 적으면 있는 만큼만 반환
 */
export function fillHomeRecommendedTodoDisplayIds({
  allTodos,
  doneIds,
  maxCount,
  incompleteCandidateIds,
  completedCandidateIds,
}: FillHomeRecommendedTodoDisplayIdsParams): string[] {
  const todoIndex = buildTodoIndexMap(allTodos);
  const targetCount = Math.min(maxCount, allTodos.length);
  const seen = new Set<string>();
  const uncompletedIds: string[] = [];

  for (const todoId of incompleteCandidateIds) {
    if (uncompletedIds.length >= targetCount) {
      break;
    }

    if (doneIds.has(todoId) || seen.has(todoId)) {
      continue;
    }

    seen.add(todoId);
    uncompletedIds.push(todoId);
  }

  const remainingSlotCount = targetCount - uncompletedIds.length;
  const completedIds =
    remainingSlotCount <= 0
      ? []
      : [...completedCandidateIds]
          .filter((todoId) => doneIds.has(todoId) && !seen.has(todoId))
          .sort((leftId, rightId) => todoIndex.get(leftId)! - todoIndex.get(rightId)!)
          .slice(0, remainingSlotCount);

  return [...uncompletedIds, ...completedIds];
}

function sortDisplayedTodoIds(
  displayedIds: string[],
  previousDisplayedIds: string[],
  doneIds: ReadonlySet<string>,
  replacementIds: string[],
  todoIndex: Map<string, number>
): string[] {
  const previousUncompletedOrder = previousDisplayedIds.filter((todoId) => !doneIds.has(todoId));
  const replacementOrder = [...replacementIds].sort(
    (leftId, rightId) => todoIndex.get(leftId)! - todoIndex.get(rightId)!
  );
  const remainingUncompletedOrder = previousUncompletedOrder.filter(
    (todoId) => displayedIds.includes(todoId) && !doneIds.has(todoId)
  );

  const uncompletedIds: string[] = [];
  const seen = new Set<string>();

  for (const todoId of [...replacementOrder, ...remainingUncompletedOrder]) {
    if (seen.has(todoId)) {
      continue;
    }

    seen.add(todoId);
    uncompletedIds.push(todoId);
  }

  for (const todoId of displayedIds) {
    if (doneIds.has(todoId) || seen.has(todoId)) {
      continue;
    }

    seen.add(todoId);
    uncompletedIds.push(todoId);
  }

  const completedIds = displayedIds
    .filter((todoId) => doneIds.has(todoId))
    .sort((leftId, rightId) => todoIndex.get(leftId)! - todoIndex.get(rightId)!);

  return [...uncompletedIds, ...completedIds];
}

/**
 * 홈 추천 행동 카드 초기 노출 ID 목록
 * 전체 투두 순서대로 미완료 항목을 최대 maxCount개까지 반환
 */
export function getInitialHomeRecommendedTodoDisplayIds(
  allTodos: TodoResponse[],
  doneIds: ReadonlySet<string>,
  maxCount: number = HOME_RECOMMENDED_TODO_MAX_COUNT
): string[] {
  const displayedIds: string[] = [];

  for (const todo of allTodos) {
    if (doneIds.has(todo.todo_id)) {
      continue;
    }

    displayedIds.push(todo.todo_id);

    if (displayedIds.length >= maxCount) {
      break;
    }
  }

  return displayedIds;
}

interface ResolveHomeRecommendedTodoDisplayIdsParams {
  allTodos: TodoResponse[];
  previousDisplayedIds: string[];
  doneIds: ReadonlySet<string>;
  maxCount?: number;
}

/**
 * 체크 이후 홈 추천 행동 카드 노출 ID 목록 계산
 * - 미완료 항목 우선 + 부족분은 완료 항목으로 maxCount 유지
 * - 완료 항목이 2개 이상이면 초과분을 아직 노출되지 않은 미완료 항목으로 교체 시도
 * - 교체할 미완료 항목이 없으면 완료 상태로 유지
 * - 노출 중인 항목을 모두 완료하면 미완료 항목으로 교체 시도, 부족하면 완료 항목 유지
 */
export function resolveHomeRecommendedTodoDisplayIds({
  allTodos,
  previousDisplayedIds,
  doneIds,
  maxCount = HOME_RECOMMENDED_TODO_MAX_COUNT,
}: ResolveHomeRecommendedTodoDisplayIdsParams): string[] {
  const todoById = new Map(allTodos.map((todo) => [todo.todo_id, todo]));
  const todoIndex = buildTodoIndexMap(allTodos);
  const currentDisplayedIds = previousDisplayedIds.filter((todoId) => todoById.has(todoId));

  if (currentDisplayedIds.length === 0) {
    return getInitialHomeRecommendedTodoDisplayIds(allTodos, doneIds, maxCount);
  }

  const allDisplayedDone = currentDisplayedIds.every((todoId) => doneIds.has(todoId));

  if (allDisplayedDone) {
    const unshownIncompleteIds = allTodos
      .filter((todo) => !doneIds.has(todo.todo_id) && !currentDisplayedIds.includes(todo.todo_id))
      .map((todo) => todo.todo_id);

    return fillHomeRecommendedTodoDisplayIds({
      allTodos,
      doneIds,
      maxCount,
      incompleteCandidateIds: unshownIncompleteIds,
      completedCandidateIds: currentDisplayedIds,
    });
  }

  const completedInDisplay = currentDisplayedIds.filter((todoId) => doneIds.has(todoId));

  if (completedInDisplay.length <= 1) {
    const uncompletedIds = currentDisplayedIds.filter((todoId) => !doneIds.has(todoId));
    const completedIds = completedInDisplay.slice(0, 1);

    return [...uncompletedIds, ...completedIds].slice(0, maxCount);
  }

  const keptCompletedId = completedInDisplay.reduce((earliestId, todoId) =>
    todoIndex.get(todoId)! < todoIndex.get(earliestId)! ? todoId : earliestId
  );
  const completedIdsToReplace = completedInDisplay.filter((todoId) => todoId !== keptCompletedId);

  let nextDisplayedIds = [...currentDisplayedIds];
  const displayedIdSet = new Set(nextDisplayedIds);
  const replacementIds: string[] = [];

  for (const completedId of completedIdsToReplace) {
    const replaceIndex = nextDisplayedIds.indexOf(completedId);
    const replacementId = findNextUnshownIncompleteTodoId(allTodos, doneIds, displayedIdSet);

    if (replacementId == null) {
      continue;
    }

    nextDisplayedIds[replaceIndex] = replacementId;
    displayedIdSet.delete(completedId);
    displayedIdSet.add(replacementId);
    replacementIds.push(replacementId);
  }

  return sortDisplayedTodoIds(
    nextDisplayedIds,
    currentDisplayedIds,
    doneIds,
    replacementIds,
    todoIndex
  ).slice(0, maxCount);
}
