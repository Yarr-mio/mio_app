import { useState } from 'react';

export interface HomeRecommendedAction {
  id: string;
  text: string;
  completed: boolean;
}

const MOCK_HAS_ACTIONS = true;
const MOCK_ACTIONS_INITIAL: HomeRecommendedAction[] = [
  { id: '1', text: '5분-호흡 연습하기', completed: true },
  { id: '2', text: '생각의 흐름을 있는 그대로 적어 보기', completed: true },
  { id: '3', text: '왜곡된 생각이 없는지 체크해 보기', completed: false },
];

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
    actions,
    toggleAction,
  };
}
