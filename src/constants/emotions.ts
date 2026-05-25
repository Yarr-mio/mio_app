import type { EmotionType } from '@/types/checkin';
import type { ImageSourcePropType } from 'react-native';

export interface EmotionMeta {
  label: string;
  subLabel: string;
  image: ImageSourcePropType;
}

export const EMOTION_META: Record<EmotionType, EmotionMeta> = {
  sad: {
    label: '슬픔',
    subLabel: '마음이 무거워요',
    image: require('../../assets/images/emotion/sad.png'),
  },
  ashamed: {
    label: '부끄러움',
    subLabel: '숨고 싶어요',
    image: require('../../assets/images/emotion/ashamed.png'),
  },
  numb: {
    label: '공허함',
    subLabel: '아무 느낌이 없어요',
    image: require('../../assets/images/emotion/numb.png'),
  },
  anxious: {
    label: '불안함',
    subLabel: '마음이 두근거려요',
    image: require('../../assets/images/emotion/anxious.png'),
  },
  tired: {
    label: '지침',
    subLabel: '쉬고 싶어요',
    image: require('../../assets/images/emotion/tired.png'),
  },
  happy: {
    label: '행복함',
    subLabel: '기분이 좋아요',
    image: require('../../assets/images/emotion/happy.png'),
  },
  angry: {
    label: '화남',
    subLabel: '짜증이 나요',
    image: require('../../assets/images/emotion/angry.png'),
  },
  calm: {
    label: '괜찮음',
    subLabel: '마음이 차분해요',
    image: require('../../assets/images/emotion/calm.png'),
  },
  confused: {
    label: '혼란',
    subLabel: '생각이 많아요',
    image: require('../../assets/images/emotion/confused.png'),
  },
};
