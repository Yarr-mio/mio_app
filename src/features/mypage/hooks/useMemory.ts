import { deleteMemoryRecord, fetchMemoryList, updateMemoryRecord } from '@/api/endpoints/my';
import { queryKeys } from '@/api/queryKeys';
import type { MemoryRecord } from '@/types/memory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useMemoryList() {
  return useQuery({
    queryKey: queryKeys.memory.list(),
    queryFn: fetchMemoryList,
  });
}

export function useDeleteMemoryRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMemoryRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memory.all() });
    },
  });
}

export function useUpdateMemoryRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, description }: { id: string; description: string }) =>
      updateMemoryRecord(id, description),
    onSuccess: (updated: MemoryRecord) => {
      queryClient.setQueryData<MemoryRecord[]>(queryKeys.memory.list(), (prev) =>
        prev ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev
      );
    },
  });
}
