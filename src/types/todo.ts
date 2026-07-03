export type TodoStatus = 'suggested' | 'completed' | 'partial_completed' | 'skipped' | 'expired';

export interface TodoResponse {
  todo_id: string;
  action_text: string;
  category: string;
  difficulty: number;
  estimated_minutes: number;
  status: TodoStatus;
  created_at: string;
  character_comment: string;
}

export interface TodoListResponse {
  todos: TodoResponse[];
}

export interface TodoCheckinRequest {
  status: 'completed' | 'partial_completed' | 'skipped';
  before_emotion?: number;
  after_emotion?: number;
  feedback?: string;
}

export interface TodoCheckinResponse {
  status: string;
  before_emotion?: number;
  after_emotion?: number;
  character_reaction: string;
}
