import apiClient from '@/api/client';
import { USE_MOCK } from '@/constants/config';
import type { ApiMeta } from '@/types/common';
import type {
  DeleteAllMemoryResponse,
  DeleteMemoryCategoryResponse,
  GetMemoryResponse,
  MemoryCategory,
  MemoryRecord,
} from '@/types/memory';

function createMockMeta(): ApiMeta {
  return { trace_id: `mock_${Date.now()}` };
}

// fetchMemoryList는 실제 API 명세에 없는 mock 전용 함수다.
// TODO: /v1/user/memory 스펙 확정 시 교체 대상.
let MOCK_MEMORY_LIST: MemoryRecord[] = [
  {
    id: 'mock-1',
    category: 'emotion',
    category_label: '반복 감정',
    title: '불안이 자주 올라와요',
    description:
      '중요한 시험을 앞두고 불안감이 극도로 커졌어요. 불안함을 안정감으로 바꾸는 연습을 했어요.',
    created_at: '2026-05-14T12:40:00Z',
  },
  {
    id: 'mock-2',
    category: 'pattern',
    category_label: 'CBT 패턴',
    title: '부정적 자기 대화를 반복해요',
    description:
      '어려운 상황에서 자신을 비난하는 경향이 발견됐어요. 자기 비판 패턴을 완화하는 연습이 필요해요.',
    created_at: '2026-05-13T09:20:00Z',
  },
  {
    id: 'mock-3',
    category: 'belief',
    category_label: '핵심 신념',
    title: '나는 실패하면 안 된다',
    description:
      '완벽주의적 신념이 스트레스의 주요 원인으로 확인됐어요. 실수도 성장의 과정임을 인식하는 연습을 해요.',
    created_at: '2026-05-12T15:05:00Z',
  },
  {
    id: 'mock-4',
    category: 'emotion',
    category_label: '감정 기록',
    title: '갑작스러운 무기력함',
    description:
      '특별한 이유 없이 무기력함이 느껴졌어요. 에너지를 회복하는 루틴을 함께 찾아봤어요.',
    created_at: '2026-05-11T20:30:00Z',
  },
  {
    id: 'mock-5',
    category: 'episode',
    category_label: '대화 요약',
    title: '취업 스트레스 이야기',
    description:
      '취업 준비로 인한 불안과 압박감을 나눴어요. 현실적인 목표를 다시 설정하는 시간을 가졌어요.',
    created_at: '2026-05-10T11:15:00Z',
  },
  {
    id: 'mock-6',
    category: 'behavior',
    category_label: '행동 기록',
    title: '매일 30분 걷기를 시작했어요',
    description:
      '규칙적인 산책이 기분 개선에 효과적이라는 것을 발견했어요. 꾸준히 이어갈 수 있도록 응원해요.',
    created_at: '2026-05-09T08:00:00Z',
  },
  {
    id: 'mock-7',
    category: 'pattern',
    category_label: 'CBT 패턴',
    title: '상황을 과도하게 일반화해요',
    description:
      '한 번의 실수를 모든 상황에 적용하는 사고 패턴이 발견됐어요. 구체적인 증거를 살피는 연습을 해요.',
    created_at: '2026-05-08T16:45:00Z',
  },
  {
    id: 'mock-8',
    category: 'belief',
    category_label: '핵심 신념',
    title: '다른 사람의 기대를 충족해야 해',
    description:
      '타인의 인정을 얻으려는 신념이 자신을 힘들게 만들고 있었어요. 나 자신의 기준을 세우는 것이 중요해요.',
    created_at: '2026-05-07T14:20:00Z',
  },
];

export async function fetchMemoryList(): Promise<MemoryRecord[]> {
  if (USE_MOCK) {
    return [...MOCK_MEMORY_LIST];
  }

  const { data } = await apiClient.get<{ data: MemoryRecord[] }>('/v1/user/memory/list');
  return data.data;
}

export async function fetchMemoryCategories(): Promise<GetMemoryResponse> {
  if (USE_MOCK) {
    return {
      data: {
        categories: [
          {
            category: 'belief',
            label: '핵심 신념',
            description: '대화에서 발견된 사고 패턴과 핵심 신념',
            count: 3,
            last_updated_at: '2026-05-28T10:00:00Z',
            sensitivity: 'sensitive',
            can_delete: true,
          },
          {
            category: 'episode',
            label: '대화 요약',
            description: '세션 종료 후 저장된 대화 요약',
            count: 12,
            last_updated_at: '2026-05-30T22:00:00Z',
            sensitivity: 'sensitive',
            can_delete: true,
          },
          {
            category: 'emotion',
            label: '감정 기록',
            description: '체크인 및 대화에서 측정된 감정 상태',
            count: 45,
            last_updated_at: '2026-05-31T09:00:00Z',
            sensitivity: 'sensitive',
            can_delete: true,
          },
          {
            category: 'behavior',
            label: '행동 기록',
            description: 'To-do 수행 결과 및 개입 효과 데이터',
            count: 8,
            last_updated_at: '2026-05-29T20:00:00Z',
            sensitivity: 'normal',
            can_delete: true,
          },
          {
            category: 'pattern',
            label: 'CBT 패턴',
            description: '반복된 인지 왜곡 패턴',
            count: 2,
            last_updated_at: '2026-05-27T15:00:00Z',
            sensitivity: 'sensitive',
            can_delete: true,
          },
        ],
        total_count: 70,
        warning: '메모리를 삭제하면 AI 개인화 품질이 저하될 수 있습니다.',
      },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.get<GetMemoryResponse>('/v1/user/memory');
  return data;
}

export async function deleteMemoryRecord(id: string): Promise<void> {
  if (USE_MOCK) {
    MOCK_MEMORY_LIST = MOCK_MEMORY_LIST.filter((r) => r.id !== id);
    return;
  }

  const record = MOCK_MEMORY_LIST.find((r) => r.id === id);
  if (record) {
    await apiClient.delete(`/v1/user/memory/${record.category}`);
  }
}

export async function deleteMemoryCategory(
  category: MemoryCategory
): Promise<DeleteMemoryCategoryResponse> {
  if (USE_MOCK) {
    const deletedCount = MOCK_MEMORY_LIST.filter((r) => r.category === category).length;
    MOCK_MEMORY_LIST = MOCK_MEMORY_LIST.filter((r) => r.category !== category);

    const messages: Record<MemoryCategory, string> = {
      belief: '핵심 신념 데이터가 삭제되었습니다. 다음 대화부터 관련 개인화 기능이 초기화됩니다.',
      episode: '대화 요약 데이터가 삭제되었습니다. 과거 대화 맥락 기반 개인화가 초기화됩니다.',
      emotion: '감정 기록이 삭제되었습니다. 감정 패턴 분석 기반 개인화가 초기화됩니다.',
      behavior: '행동 기록이 삭제되었습니다. To-do 개인화 추천이 초기화됩니다.',
      pattern: 'CBT 패턴 데이터가 삭제되었습니다. 인지 왜곡 기반 개입 개인화가 초기화됩니다.',
    };

    return {
      data: {
        category,
        deleted_count: deletedCount,
        message: messages[category],
      },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.delete<DeleteMemoryCategoryResponse>(
    `/v1/user/memory/${category}`
  );
  return data;
}

export async function deleteAllMemory(): Promise<DeleteAllMemoryResponse> {
  if (USE_MOCK) {
    MOCK_MEMORY_LIST = [];
    return {
      data: {
        deleted: true,
        categories_cleared: ['belief', 'episode', 'emotion', 'behavior', 'pattern'],
        message: '모든 메모리가 삭제되었습니다. 다음 대화부터 개인화 기능이 초기화됩니다.',
      },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.delete<DeleteAllMemoryResponse>('/v1/user/memory', {
    data: { confirm: true },
  });
  return data;
}

export async function updateMemoryRecord(id: string, description: string): Promise<MemoryRecord> {
  if (USE_MOCK) {
    const index = MOCK_MEMORY_LIST.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Memory record not found');
    MOCK_MEMORY_LIST[index] = { ...MOCK_MEMORY_LIST[index], description };
    return { ...MOCK_MEMORY_LIST[index] };
  }

  const { data } = await apiClient.patch<{ data: MemoryRecord }>(`/v1/user/memory/${id}`, {
    description,
  });
  return data.data;
}
