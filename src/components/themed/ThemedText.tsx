import { Platform, Text, type TextProps } from 'react-native';

import { cn } from '@/utils/cn';

export type ThemedTextType =
  | 'default'
  | 'title'
  | 'small'
  | 'smallBold'
  | 'smallRegular'
  | 'smallTitle'
  | 'smallTitle2'
  | 'smallMedium'
  | 'defaultBold'
  | 'defaultRegular'
  | 'subtitle'
  | 'captionCenter'
  | 'link'
  | 'linkPrimary'
  | 'code';

// 타입별 className 프리셋 (다크모드 dark: 포함)
const typeClasses: Record<ThemedTextType, string> = {
  default: 'text-base leading-5 font-medium',
  title: 'text-3xl font-bold leading-[37px]',
  small: 'text-sm leading-5 font-medium',
  smallBold: 'text-sm leading-5 font-semibold',
  smallRegular: 'text-sm leading-5 font-normal',
  smallMedium: 'text-xs leading-4 font-medium',
  subtitle: 'text-lg font-medium leading-[20px]',
  smallTitle: 'text-base font-semibold leading-6',
  smallTitle2: 'text-lg font-semibold leading-6',
  defaultBold: 'text-base font-bold',
  defaultRegular: 'text-base leading-6 font-normal',
  captionCenter: 'text-sm font-medium leading-[18px] text-center text-fg-dim',
  link: 'text-sm font-sans leading-[30px]',
  linkPrimary: 'text-sm font-sans leading-[30px] text-link',
  code: `text-xs font-mono ${Platform.OS === 'android' ? 'font-bold' : 'font-medium'}`,
};

export type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  className?: string;
};

export function ThemedText({ className, type = 'default', ...rest }: ThemedTextProps) {
  return (
    <Text className={cn('text-ink dark:text-ink-night', typeClasses[type], className)} {...rest} />
  );
}
