import { ChevronLeftIcon, ChevronRightIcon } from '@/assets/icons';
import { ThemedText } from '@/components/themed/ThemedText';
import { TODO_DATE_NAVIGATOR_A11Y_NEXT, TODO_DATE_NAVIGATOR_A11Y_PREV } from '@/constants/todo';
import {
  FgColors,
  PressableConfig,
  TodoDateNavigatorClasses,
  TodoDateNavigatorLayout,
} from '@/constants/theme';
import { Pressable, View } from 'react-native';

interface TodoDateNavigatorProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}

export function TodoDateNavigator({ label, onPrevious, onNext }: TodoDateNavigatorProps) {
  return (
    <View className={TodoDateNavigatorClasses.container}>
      <Pressable
        onPress={onPrevious}
        accessibilityRole="button"
        accessibilityLabel={TODO_DATE_NAVIGATOR_A11Y_PREV}
        hitSlop={PressableConfig.hitSlop}
        className={TodoDateNavigatorClasses.chevronButton}
      >
        <ChevronLeftIcon
          width={TodoDateNavigatorLayout.chevronIconWidth}
          height={TodoDateNavigatorLayout.chevronIconHeight}
          color={FgColors.onDefault}
        />
      </Pressable>

      <ThemedText type="smallTitle" className={TodoDateNavigatorClasses.label}>
        {label}
      </ThemedText>

      <Pressable
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel={TODO_DATE_NAVIGATOR_A11Y_NEXT}
        hitSlop={PressableConfig.hitSlop}
        className={TodoDateNavigatorClasses.chevronButton}
      >
        <ChevronRightIcon
          width={TodoDateNavigatorLayout.chevronIconWidth}
          height={TodoDateNavigatorLayout.chevronIconHeight}
          color={FgColors.onDefault}
        />
      </Pressable>
    </View>
  );
}
