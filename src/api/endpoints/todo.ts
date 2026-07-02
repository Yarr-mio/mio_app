import apiClient from '@/api/client';
import type { ApiResponse } from '@/types/common';
import type {
  TodoCheckinRequest,
  TodoCheckinResponse,
  TodoListResponse,
  TodoResponse,
} from '@/types/todo';

export async function fetchTodos(date: string, status?: string): Promise<TodoResponse[]> {
  const { data } = await apiClient.get<ApiResponse<TodoListResponse>>('/v1/todos', {
    params: { date, status },
  });
  return data.data.todos;
}

export async function checkinTodo(
  todoId: string,
  body: TodoCheckinRequest
): Promise<TodoCheckinResponse> {
  const { data } = await apiClient.post<ApiResponse<TodoCheckinResponse>>(
    `/v1/todos/${todoId}/checkin`,
    body
  );
  return data.data;
}
