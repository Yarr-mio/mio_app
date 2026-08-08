import { HOME_RECOMMENDED_TODO_MAX_COUNT } from '@/constants/home';
import {
  buildHomeTodoDoneIdSet,
  getInitialHomeRecommendedTodoDisplayIds,
  isHomeTodoDone,
  resolveHomeRecommendedTodoDisplayIds,
} from '@/features/home/utils/resolveHomeRecommendedTodoDisplay';
import type { TodoResponse } from '@/types/todo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function buildTodoIdSetKey(todoIds: string[]): string {
  return [...todoIds].sort().join('|');
}

interface UseHomeRecommendedTodoDisplayParams {
  allTodos: TodoResponse[];
  onCompleteTodo: (todoId: string, options?: { onError?: () => void }) => void;
}

export function useHomeRecommendedTodoDisplay({
  allTodos,
  onCompleteTodo,
}: UseHomeRecommendedTodoDisplayParams) {
  const [displayedIds, setDisplayedIds] = useState<string[]>([]);
  const [optimisticDoneIds, setOptimisticDoneIds] = useState<Set<string>>(() => new Set());
  const previousTodoSetKeyRef = useRef('');

  const todoById = useMemo(() => new Map(allTodos.map((todo) => [todo.todo_id, todo])), [allTodos]);
  const todoSetKey = useMemo(
    () => buildTodoIdSetKey(allTodos.map((todo) => todo.todo_id)),
    [allTodos]
  );

  useEffect(() => {
    if (todoSetKey === previousTodoSetKeyRef.current) {
      return;
    }

    previousTodoSetKeyRef.current = todoSetKey;
    const doneIds = buildHomeTodoDoneIdSet(allTodos);

    setOptimisticDoneIds(new Set());
    setDisplayedIds(getInitialHomeRecommendedTodoDisplayIds(allTodos, doneIds));
  }, [allTodos, todoSetKey]);

  useEffect(() => {
    setOptimisticDoneIds((previousOptimisticDoneIds) => {
      if (previousOptimisticDoneIds.size === 0) {
        return previousOptimisticDoneIds;
      }

      const nextOptimisticDoneIds = new Set(
        [...previousOptimisticDoneIds].filter((todoId) => {
          const todo = todoById.get(todoId);
          return todo != null && !isHomeTodoDone(todo.status);
        })
      );

      return nextOptimisticDoneIds.size === previousOptimisticDoneIds.size
        ? previousOptimisticDoneIds
        : nextOptimisticDoneIds;
    });
  }, [allTodos, todoById]);

  const doneIds = useMemo(
    () => buildHomeTodoDoneIdSet(allTodos, optimisticDoneIds),
    [allTodos, optimisticDoneIds]
  );

  const displayedTodos = useMemo(
    () =>
      displayedIds.flatMap((todoId) => {
        const todo = todoById.get(todoId);
        return todo ? [todo] : [];
      }),
    [displayedIds, todoById]
  );

  const completeDisplayedTodo = useCallback(
    (todoId: string) => {
      setOptimisticDoneIds((previousOptimisticDoneIds) => {
        const nextOptimisticDoneIds = new Set(previousOptimisticDoneIds);
        nextOptimisticDoneIds.add(todoId);
        return nextOptimisticDoneIds;
      });

      setDisplayedIds((previousDisplayedIds) => {
        const nextOptimisticDoneIds = new Set(optimisticDoneIds);
        nextOptimisticDoneIds.add(todoId);

        const nextDoneIds = buildHomeTodoDoneIdSet(allTodos, nextOptimisticDoneIds);

        return resolveHomeRecommendedTodoDisplayIds({
          allTodos,
          previousDisplayedIds,
          doneIds: nextDoneIds,
          maxCount: HOME_RECOMMENDED_TODO_MAX_COUNT,
        });
      });

      onCompleteTodo(todoId, {
        onError: () => {
          setOptimisticDoneIds((previousOptimisticDoneIds) => {
            const rolledBackOptimisticDoneIds = new Set(previousOptimisticDoneIds);
            rolledBackOptimisticDoneIds.delete(todoId);
            return rolledBackOptimisticDoneIds;
          });

          setDisplayedIds((previousDisplayedIds) => {
            const rolledBackOptimisticDoneIds = new Set(optimisticDoneIds);
            rolledBackOptimisticDoneIds.delete(todoId);

            return resolveHomeRecommendedTodoDisplayIds({
              allTodos,
              previousDisplayedIds,
              doneIds: buildHomeTodoDoneIdSet(allTodos, rolledBackOptimisticDoneIds),
              maxCount: HOME_RECOMMENDED_TODO_MAX_COUNT,
            });
          });
        },
      });
    },
    [allTodos, onCompleteTodo, optimisticDoneIds]
  );

  return {
    displayedTodos,
    completeDisplayedTodo,
    isDisplayedTodoDone: (todoId: string) => doneIds.has(todoId),
  };
}
