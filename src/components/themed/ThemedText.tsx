import { Platform, Text, type TextProps } from 'react-native';

import { cn } from '@/utils/cn';

export type ThemedTextType =
  | 'default'
  | 'title'
  | 'small'
  | 'smallBold'
  | 'subtitle'
  | 'link'
  | 'linkPrimary'
  | 'code';

// 타입별 className 프리셋 (다크모드 dark: 포함)
const typeClasses: Record<ThemedTextType, string> = {
  default: 'text-base leading-6 font-medium',
  title: 'text-5xl font-semibold leading-[52px]',
  small: 'text-sm leading-5 font-medium',
  smallBold: 'text-sm leading-5 font-bold',
  subtitle: 'text-3xl leading-[44px] font-semibold',
  link: 'text-sm leading-[30px]',
  linkPrimary: 'text-sm leading-[30px] text-[#3c87f7]',
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
