import { useState } from 'react';

export interface HomeRecommendedAction {
  id: string;
  text: string;
  completed: boolean;
}

const MOCK_HAS_ACTIONS = true;

const MOCK_HOME_TITLE = '오늘도 잘 찾아왔어요';

const MOCK_ACTIONS_INITIAL: HomeRecommendedAction[] = [
  { id: '1', text: '5분-호흡 연습하기', completed: true },
  { id: '2', text: '생각의 흐름을 있는 그대로 적어 보기', completed: true },
  { id: '3', text: '왜곡된 생각이 없는지 체크해 보기', completed: false },
];

const MOCK_WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const MOCK_WEEK_INTENSITIES = [2, 3, 4, 3, 5, 4, 6] as const;

export function useHomeMock() {
  const [actions, setActions] = useState(() =>
    MOCK_ACTIONS_INITIAL.map((action) => ({ ...action }))
  );

  const toggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((action) =>
        action.id === id ? { ...action, completed: !action.completed } : action
      )
    );
  };

  return {
    hasActions: MOCK_HAS_ACTIONS,
    homeTitle: MOCK_HOME_TITLE,
    weekLabels: [...MOCK_WEEK_LABELS] as string[],
    weekIntensities: [...MOCK_WEEK_INTENSITIES] as number[],
    actions,
    toggleAction,
  };
}
