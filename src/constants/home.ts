export const HOME_TITLES = {
  checkedIn: '오늘도 잘 찾아왔어요',
  notCheckedIn: '오늘의 마음을 꺼내 봐요',
} as const;

// 홈 추천 행동 카드 최대 표시 개수 제한함
export const HOME_RECOMMENDED_TODO_MAX_COUNT = 3;

export const HOME_SPEECH_BUBBLE_MESSAGES = [
  '오늘의 감정 체크인을 시작해볼까요? ✨\n작은 기록이 큰 변화를 만들어요',
  '지금 이 순간의 마음을 기록해요! \n💭 작은 힌트가 되어줄 거예요',
  '오늘 하루를 돌아보는 시간을 가져봐요! 잠깐이면 충분해요',
  '감정을 기록하면 나를 더 잘 알 수 있어요\n오늘은 어떤 하루였나요?',
  '오늘의 마음 날씨는 어떤가요? ☁️\n편하게 이야기해 주세요',
] as const;
