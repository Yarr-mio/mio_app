import { View, type ViewProps } from 'react-native';

export type ThemedViewType = 'background' | 'backgroundElement' | 'backgroundSelected';

// 타입별 배경색 className (다크모드 dark: 포함)
const typeClasses: Record<ThemedViewType, string> = {
  background: 'bg-canvas dark:bg-canvas-night',
  backgroundElement: 'bg-panel dark:bg-panel-night',
  backgroundSelected: 'bg-chip dark:bg-chip-night',
};

export type ThemedViewProps = ViewProps & {
  type?: ThemedViewType;
  className?: string;
};

export function ThemedView({ className, type = 'background', style, ...rest }: ThemedViewProps) {
  return <View className={`${typeClasses[type]} ${className ?? ''}`} style={style} {...rest} />;
}
