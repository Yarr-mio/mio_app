import type { ApiMeta } from '@/types/common';

export type MemoryCategory = 'belief' | 'episode' | 'emotion' | 'behavior' | 'pattern';

export interface MemoryRecord {
  id: string;
  category: MemoryCategory;
  category_label: string;
  title: string;
  description: string;
  created_at: string;
}

export interface MemoryCategoryItem {
  category: MemoryCategory;
  label: string;
  description: string;
  count: number;
  last_updated_at: string | null;
  sensitivity: 'normal' | 'sensitive';
  can_delete: boolean;
}

export interface GetMemoryResponse {
  data: {
    categories: MemoryCategoryItem[];
    total_count: number;
    warning: string;
  };
  meta: ApiMeta;
}

export interface DeleteAllMemoryResponse {
  data: {
    deleted: boolean;
    categories_cleared: MemoryCategory[];
    message: string;
  };
  meta: ApiMeta;
}

export interface DeleteMemoryCategoryResponse {
  data: {
    category: MemoryCategory;
    deleted_count: number;
    message: string;
  };
  meta: ApiMeta;
}
